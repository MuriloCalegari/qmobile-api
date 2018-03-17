CREATE TABLE IF NOT EXISTS `endpoint` (
  `id` CHAR(36) NOT NULL,
  `nome` VARCHAR(50) NOT NULL,
  `url` VARCHAR(100) NOT NULL,
  `strategy` INT NOT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `professor` (
  `id` CHAR(36) NOT NULL,
  `nome` VARCHAR(45) NOT NULL,
  `endpoint` CHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`endpoint`) REFERENCES `endpoint` (`id`)
);

CREATE TABLE IF NOT EXISTS `disciplina` (
  `id` CHAR(36) NOT NULL,
  `nome` VARCHAR(60) NOT NULL,
  `endpoint` CHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`endpoint`) REFERENCES `endpoint` (`id`)
);

CREATE TABLE IF NOT EXISTS `usuario` (
  `id` CHAR(36) NOT NULL,
  `nome` VARCHAR(45) NOT NULL,
  `matricula` VARCHAR(45) NOT NULL,
  `password` VARCHAR(70) NOT NULL,
  `endpoint` CHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`endpoint`) REFERENCES `endpoint` (`id`)
);

CREATE TABLE IF NOT EXISTS `session` (
  `id` CHAR(36) NOT NULL,
  `instance` VARCHAR(100),
  `usuario` CHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`usuario`) REFERENCES `usuario` (`id`)
);

CREATE TABLE IF NOT EXISTS `disciplina_professor` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `periodo` DATE NOT NULL,
  `turma` VARCHAR(50) NOT NULL,
  `disciplina` CHAR(36) NOT NULL,
  `professor` CHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`disciplina`) REFERENCES `disciplina` (`id`),
  FOREIGN KEY (`professor`) REFERENCES `professor` (`id`)
);

CREATE TABLE IF NOT EXISTS `session` (
  `id` VARCHAR(36) NOT NULL,
  `usuario` CHAR(36) NOT NULL,
  `instance` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`, `usuario`),
  FOREIGN KEY (`usuario`) REFERENCES `usuario` (`id`)
);

CREATE TABLE IF NOT EXISTS `usuario_disciplina` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `disciplina_professor` INT NOT NULL,
  `usuario` CHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`disciplina_professor`) REFERENCES `disciplina_professor` (`id`),
  FOREIGN KEY (`usuario`) REFERENCES `usuario` (`id`)
);

CREATE TABLE IF NOT EXISTS `nota` (
  `id` CHAR(36) NOT NULL,
  `usuario_disciplina` INT NOT NULL,
  `descricao` VARCHAR(60) NOT NULL,
  `etapa` INT NOT NULL,
  `peso` INT,
  `notamaxima` INT,
  `nota` INT,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`usuario_disciplina`) REFERENCES `usuario_disciplina` (`id`)
);
