[logo]: https://circleci.com/gh/Alan-Gomes/qmobile-api.svg?style=shield&circle-token=664d4999a59f1b774789b0e63b64534aa07388c7 "CircleCI Status"


# QMobile API
[![Coverage Status](https://coveralls.io/repos/github/Alan-Gomes/qmobile-api/badge.svg?branch=master)](https://coveralls.io/github/Alan-Gomes/qmobile-api?branch=master)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/Alan-Gomes/qmobile-api/blob/master/LICENSE)
[![CircleCI Status][logo]](https://circleci.com/gh/Alan-Gomes/qmobile-api)
![Dependencies](https://david-dm.org/Alan-Gomes/qmobile-api.svg)
[![GitHub issues](https://img.shields.io/github/issues/Alan-Gomes/qmobile-api.svg)](https://github.com/Alan-Gomes/qmobile-api/issues)

Esse repositório contém o servidor do app QMobile (em desenvolvimento). Este sistema faz o login nos servidores do Q-Acadêmico e provê uma abstração para leitura dos dados.

Este projeto faz parte do meu trabalho de conclusão de curso, espera-se que esteja pronto no final de 2018 :satisfied:

Utilizando deste servidor, futuramente o aplicativo mobile será capaz de exibir e gerenciar os dados recolhidos.

## Tecnologias utilizadas

* Node.js
* Express
* MariaDB
* Redis
* TypeScript
* Puppeteer

## Rodando o servidor

Antes de começar, certifique-se de que possua MariaDB, Redis e Node.js instalados em sua máquina.

Clone o repositório e entre dentro dele:

```bash
git clone https://github.com/Alan-Gomes/qmobile-api

cd qmobile-api
```

Para rodar o servidor, é necessário que sejam instaladas todas as dependências, com o comando:

```bash
npm install
```
Após instalar as dependencias, execute o projeto:

```bash
npm start
```
Quando o comando for executado pela primeira vez, ele avisará que é necessário a configuração do sistema, para fazer isso, volte para a pasta raiz e abra o arquivo **config.json**.

O arquivo se parecerá com:

```json
{
    "cipher_pass": "00000000000000000000000000000000",
    "database": {
        "host": "localhost",
        "username": "root",
        "password": "12345",
        "port": 3306,
        "database": "qmobile",
        "logging": false
    },
    "update_queue_size": 50,
    "max_instances": 40
}
```

A opção **cipher_pass** se refere a chave da cifra (exatamente 32 caracteres) que é utilizada para guardar as senhas dos usuários no banco de dados, é de extrema importância que ela seja alterada para maior segurança.

As opções contidas em **db** são as configurações do banco de dados, o sistema atualmente só suporta MariaDB.
