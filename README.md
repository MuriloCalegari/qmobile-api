[logo]: https://circleci.com/gh/Alan-Gomes/qmobile-api.svg?style=shield&circle-token=664d4999a59f1b774789b0e63b64534aa07388c7 "CircleCI Status"


# QMobile API
[![Coverage Status](https://coveralls.io/repos/github/Alan-Gomes/qmobile-api/badge.svg?branch=master)](https://coveralls.io/github/Alan-Gomes/qmobile-api?branch=master)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/Alan-Gomes/qmobile-api/blob/master/LICENSE)
[![CircleCI Status][logo]](https://circleci.com/gh/Alan-Gomes/qmobile-api)
![Dependencies](https://david-dm.org/Alan-Gomes/qmobile-api.svg)
[![GitHub issues](https://img.shields.io/github/issues/Alan-Gomes/qmobile-api.svg)](https://github.com/Alan-Gomes/qmobile-api/issues)
[![](https://images.microbadger.com/badges/image/alangomes/qmobile-api.svg)](https://microbadger.com/images/alangomes/qmobile-api)

Esse repositório contém o servidor do app QMobile (em desenvolvimento). Este sistema faz o login nos servidores do Q-Acadêmico e provê uma abstração para leitura dos dados.

Este projeto faz parte do meu trabalho de conclusão de curso, que será entregue no final de 2018 :satisfied:

Utilizando deste servidor, futuramente o aplicativo mobile será capaz de exibir e gerenciar os dados recolhidos.

## Tecnologias utilizadas

* Node.js
* Express
* MariaDB
* Redis
* TypeScript

## Subindo um container com docker

Antes de começar, certifique-se de que possua docker-compose instalado.

Clone o repositório e entre dentro dele:

```bash
git clone https://github.com/Alan-Gomes/qmobile-api

cd qmobile-api
```

Para iniciar o sistema, execute o comando:
```bash
sudo docker-compose up -d
```

Caso a saída seja a seguinte, tudo está correto:
```
Starting qmobileapi_mariadb_1 ... 
Starting qmobileapi_redis_1 ... done
Starting qmobileapi_web_1 ... done
```
Agora só acessar http://localhost:3002/graphiql para interagir com a API.
