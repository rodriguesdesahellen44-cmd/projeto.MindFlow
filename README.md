# ✦ MindFlow

MindFlow é um diário emocional retrô para projeto escolar. Ele combina pixel art, autorreflexão e pequenas conquistas sem se apresentar como terapia ou diagnóstico.

## Como executar

O servidor usa Flask e a persistência usa SQLite, incluído na biblioteca padrão. Com Python 3 instalado, instale a dependência e execute na pasta do projeto:

```bash
python3 -m pip install -r requirements.txt
python3 app.py
```

Abra `http://127.0.0.1:8000` no navegador. O arquivo `data/mindflow.sqlite3` será criado automaticamente na primeira inicialização.

A interface continua usando HTML, CSS e JavaScript, tecnologias executadas pelo navegador; não há código Java no projeto.

## Organização

- `app.py`: fábrica da aplicação Flask e inicialização do servidor.
- `config.py`: configuração da aplicação.
- `routes/`: páginas e API de persistência.
- `models/`: validação e leitura/gravação do estado do MindFlow.
- `database.py`: conexão e inicialização do SQLite.
- `templates/`: página HTML renderizada pelo Flask.
- `static/`: CSS, JavaScript e manifesto do aplicativo.
- `database/`: schemas SQLite e MySQL do projeto.

Para rodar os testes automatizados do banco e da API:

```bash
python3 -m unittest discover -s tests -v
```

## Recursos

- Entrada simples com nome
- Check-in emocional com nove humores
- XP, níveis e árvore das emoções
- Missões diárias
- Diário com edição, exclusão e pesquisa
- Histórico com filtros
- Progresso e gráfico de humores
- Frase do dia
- Palavra do dia e reflexão pessoal
- Pausa com respiração guiada
- Perfil, configurações, exportação e exclusão de dados
- Persistência no banco SQLite (`data/mindflow.sqlite3`), com cópia local para migração e contingência
- Navegação inferior responsiva

## Banco de dados

O schema SQLite usado pelo aplicativo está em [`database/sqlite_schema.sql`](database/sqlite_schema.sql). Ao iniciar, o servidor Python cria as tabelas automaticamente e mantém o perfil, o diário, os registros emocionais, as reflexões e as missões concluídas.

O schema MySQL 8 do diagrama do MindFlow permanece em [`database/schema.sql`](database/schema.sql). A entrega em PDF com o DER e o schema correspondente está em [`database/entrega-modelagem-banco.pdf`](database/entrega-modelagem-banco.pdf).
