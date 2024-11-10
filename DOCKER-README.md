# Blockchain Gestão de Água

## Pré-requisitos

- Docker
- Docker Compose

## Como executar

1. Clone este repositório:
```bash
git clone [URL_DO_REPOSITORIO]
cd blockchain-gestao-agua
```

2. Inicie a aplicação:
```bash
docker-compose up --build
```

3. Acesse a aplicação em http://localhost:3000

## Para parar a aplicação

```bash
docker-compose down
```

## Para limpar todos os dados e recomeçar

```bash
docker-compose down -v
docker system prune -f
```
