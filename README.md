# QMobile REST

Esse repositório contém o servidor do app QMobile (em desenvolvimento). Este sistema faz o login nos servidores do Q-Acadêmico e provê uma abstração REST para leitura dos dados.

Este projeto faz parte do meu trabalho de conclusão de curso, espera-se que estja pronto no final de 2018 :satisfied:

Utilizando deste servidor, futuramente o aplicativo mobile será capaz de exibir e gerenciar os dados recolhidos.

## Tecnologias utilizadas

* Node.js
* Express
* PostgreSQL
* Redis
* TypeScript
* PhantomJS

## Rodando o servidor

Antes de começar, certifique-se de que possua PostgreSQL, Redis, PhantomJS e Node.js instalados em sua máquina.

Clone o repositório e entre dentro dele:

```bash
https://github.com/Alan-Gomes/qmobile-rest

cd qmobile-rest
```

Para rodar o servidor, é necessário que sejam instaladas todas as dependências, com o comando:

```bash
npm install
```

Após isso, instale o gulp globalmente para que possa realizar build:

```bash
npm install gulp-cli -g
```

Faça build dos códigos fontes digitando:

```bash
gulp
```

Após realizar build, acesse a pasta de saída e execute o projeto:

```bash
cd dist/
node qmobile.js
```
Quando o comando for executado pela primeira vez, ele avisará que é necessário a configuração do sistema, para fazer isso, volte para a pasta raiz e abra o arquivo **config.json**.

O arquivo se parecerá com:

```json
{
    "cipher_pass": "123mudar",
    "db": {
        "host": "localhost",
        "username": "postgres",
        "password": "postgres",
        "port": 5432,
        "database": "qmobile"
    },
    "tests": {
        "endpoint": null,
        "login": null,
        "password": null,
        "name": null
    }
}
```

A opção **cipher_pass** se refere a chave da cifra que é utilizada para guardar as senhas dos usuários no banco de dados, é de extrema importância que ela seja alterada para maior segurança.

As opções contidas em **db** são as configurações do banco de dados, o sistema atualmente só suporta PostgreSQL.

As opções em **tests** são os dados de entrada no Q-Acadêmico, sendo:

* **endpoint**: Url base do serviço. Ex: *http://qacademico.ifexemplo.edu.br/qacademico*
* **login**: Login do usuário (matrícula)
* **password**: Senha do usuário
* **name**: Nome completo do usuário (o mesmo do Q-Acadêmico)