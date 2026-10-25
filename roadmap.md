# Roadmap

## Concluído
- Listar as alterações feitas direto no GitHub (10 commits de 24/10: backend Express + MongoDB, deploy no Render, cliente de API, ajustes de config).
- Corrigir os erros de conferência de tipos que travavam o build (`id?: string | undefined`, acesso a `VITE_API_URL`, dependência que faltava). Build OK, 6 testes passando.

## Pendente
- Fazer o app voltar a mostrar dados no preview. O frontend agora chama a API do backend Express/MongoDB, que não está de pé aqui: não há `server/.env` com `MONGODB_URI`, nem as dependências do backend instaladas. Bloqueado em uma credencial — preciso da string de conexão do MongoDB Atlas (ou de um "use outro banco por enquanto") para subir o backend e conferir o fluxo completo de cadastro → preenchimento → painel.
