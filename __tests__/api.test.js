const request = require('supertest');
const { app } = require('../server');
const pedidosDb = require('../db/pedidos');
const usuariosDb = require('../db/usuarios');
const bcrypt = require('bcryptjs');
const s3Service = require('../services/s3Service');
const jwt = require('jsonwebtoken');

// Mocks
jest.mock('../db/pedidos');
jest.mock('../db/usuarios');
jest.mock('bcryptjs');
jest.mock('../services/s3Service');
jest.mock('jsonwebtoken');

describe('Testes Avançados da API - Fluxos Críticos', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    // --- 1. Autenticação (Login) ---
    describe('POST /api/auth/login', () => {
        test('Deve fazer login com sucesso usando credenciais válidas', async () => {
            // Mock do usuário no banco
            usuariosDb.buscarPorEmailOuCpf.mockResolvedValue({
                _id: '123',
                email: 'teste@teste.com',
                senha: 'hash_da_senha',
                toJSONPublico: () => ({ id: '123', email: 'teste@teste.com' })
            });
            // Mock do bcrypt e jwt
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('fake_jwt_token');

            const res = await request(app)
                .post('/api/auth/login')
                .send({ identificador: 'teste@teste.com', senha: '123' });

            expect(res.status).toBe(200);
            expect(res.body.token).toBe('fake_jwt_token');
            expect(res.body.email).toBe('teste@teste.com');
        });

        test('Deve retornar 401 se a senha for inválida', async () => {
            usuariosDb.buscarPorEmailOuCpf.mockResolvedValue({
                _id: '123', email: 'teste@teste.com', senha: 'hash_da_senha'
            });
            bcrypt.compare.mockResolvedValue(false);

            const res = await request(app)
                .post('/api/auth/login')
                .send({ identificador: 'teste@teste.com', senha: 'senha_errada' });

            expect(res.status).toBe(401);
            expect(res.body.erro).toBe('Credenciais inválidas');
        });
    });

    // --- 2. Criação de Pedido e Upload S3 ---
    describe('POST /api/pedidos', () => {
        test('Deve criar pedido e simular upload para S3 usando JWT válido', async () => {
            // Mock do S3
            s3Service.uploadBase64ParaS3.mockResolvedValue('https://s3.amazonaws.com/fake-url');
            pedidosDb.criarPedido.mockResolvedValue({ id: '999', status: 'Pendente' });
            jwt.verify.mockImplementation((token, secret, cb) => cb(null, { id: '123', email: 'maria@teste.com' }));

            const payload = {
                solicitante: "Maria",
                documentosAnexos: [
                    { id: "doc1", rotulo: "RG", dados: "data:image/png;base64,iVBORw0KGgo..." }
                ]
            };

            const res = await request(app)
                .post('/api/pedidos')
                .set('Authorization', 'Bearer fake_valid_token') // Simulando front-end novo JWT
                .send(payload);

            expect(res.status).toBe(201);
            expect(s3Service.uploadBase64ParaS3).toHaveBeenCalledTimes(1);
            expect(pedidosDb.criarPedido).toHaveBeenCalledTimes(1);
            expect(res.body.status).toBe('Pendente');
        });

        test('Deve ser bloqueado (403) se não enviar o token (acesso negado)', async () => {
            const res = await request(app)
                .post('/api/pedidos')
                .send({});
            
            expect(res.status).toBe(403);
            expect(res.body.erro).toMatch(/Acesso negado/);
        });
    });

    // --- 3. Pre-Signed URLs ---
    describe('GET /api/documentos/download', () => {
        test('Deve retornar a URL pre-assinada (mock S3)', async () => {
            s3Service.gerarPreSignedUrl.mockResolvedValue('https://s3.amazonaws.com/fake-url?signature=123');

            const res = await request(app)
                .get('/api/documentos/download?url=original_s3_url');
            
            expect(res.status).toBe(200);
            expect(res.body.url).toContain('signature=123');
            expect(s3Service.gerarPreSignedUrl).toHaveBeenCalledWith('original_s3_url');
        });
    });
});
