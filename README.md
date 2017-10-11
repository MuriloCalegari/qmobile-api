# QMobile REST

Esse repositório contém o servidor REST do app QMobile (em desenvolvimento). Este sistema faz o login nos servidores do Q-Acadêmico e provê uma abstração REST para leitura dos dados.

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
