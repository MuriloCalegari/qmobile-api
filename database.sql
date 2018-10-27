CREATE TABLE IF NOT EXISTS `endpoint` (
  `id` CHAR(36) NOT NULL,
  `nome` VARCHAR(50) NOT NULL,
  `url` VARCHAR(100) NOT NULL,
  `strategy` INT NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE IF NOT EXISTS `professor` (
  `id` CHAR(36) NOT NULL,
  `nome` VARCHAR(45) NOT NULL,
  `endpoint` CHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`endpoint`) REFERENCES `endpoint` (`id`)
) DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE IF NOT EXISTS `disciplina` (
  `id` CHAR(36) NOT NULL,
  `nome` VARCHAR(60) NOT NULL,
  `endpoint` CHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`endpoint`) REFERENCES `endpoint` (`id`)
) DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE IF NOT EXISTS `usuario` (
  `id` CHAR(36) NOT NULL,
  `nome` VARCHAR(45) NOT NULL,
  `matricula` VARCHAR(45) NOT NULL,
  `password` VARCHAR(70) NOT NULL,
  `inicializado` INT(1) NOT NULL,
  `endpoint` CHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`endpoint`) REFERENCES `endpoint` (`id`)
) DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE IF NOT EXISTS `session` (
  `id` CHAR(36) NOT NULL,
  `usuario` CHAR(36) NOT NULL,
  `instance` VARCHAR(100),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`usuario`) REFERENCES `usuario` (`id`)
) DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE IF NOT EXISTS `disciplina_professor` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `periodo` DATE NOT NULL,
  `turma` VARCHAR(50) NOT NULL,
  `disciplina` CHAR(36) NOT NULL,
  `professor` CHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`disciplina`) REFERENCES `disciplina` (`id`),
  FOREIGN KEY (`professor`) REFERENCES `professor` (`id`)
) DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE IF NOT EXISTS `usuario_disciplina` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `disciplina_professor` INT NOT NULL,
  `usuario` CHAR(36) NOT NULL,
  `favorito` INT(1) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`disciplina_professor`) REFERENCES `disciplina_professor` (`id`),
  FOREIGN KEY (`usuario`) REFERENCES `usuario` (`id`)
) DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE IF NOT EXISTS `boletim` (
  `id`                 INT NOT NULL AUTO_INCREMENT,
  `usuario_disciplina` INT NOT NULL,
  `situacao` VARCHAR(15) NOT NULL,
  `etapa1`             FLOAT,
  `etapa2`             FLOAT,
  `rp_etapa1`          FLOAT,
  `rp_etapa2`          FLOAT,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`usuario_disciplina`) REFERENCES `usuario_disciplina` (`id`)
) DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE IF NOT EXISTS `nota` (
  `id` CHAR(36) NOT NULL,
  `usuario_disciplina` INT NOT NULL,
  `descricao` VARCHAR(255) NOT NULL,
  `data` DATE NOT NULL,
  `etapa` INT NOT NULL,
  `media` FLOAT NOT NULL,
  `peso` FLOAT,
  `notamaxima` FLOAT,
  `nota` FLOAT,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`usuario_disciplina`) REFERENCES `usuario_disciplina` (`id`)
) DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE FUNCTION IF NOT EXISTS calcula_media (pi_nota FLOAT, pi_peso FLOAT, pi_notaMaxima FLOAT)
  RETURNS FLOAT
BEGIN
    DECLARE nota FLOAT;
    DECLARE notaMaxima FLOAT;
    DECLARE media FLOAT;

    SET nota = GREATEST(pi_nota, 0);
    IF pi_peso <= 0 THEN
      RETURN pi_nota;
    END IF;

    SET notaMaxima = GREATEST(pi_notaMaxima, pi_peso, 0);
    IF notaMaxima <= 0 OR nota > notaMaxima THEN
      SET notaMaxima = 10;
    END IF;

    SET media = (nota / notaMaxima) * 10;
    SET media = ROUND(media, 2);
    RETURN media;
END;

CREATE TRIGGER IF NOT EXISTS TG_nota_insert BEFORE INSERT
ON nota
FOR EACH ROW
BEGIN
    SET NEW.media = calcula_media(NEW.nota, NEW.peso, NEW.notamaxima);
END;

CREATE TRIGGER IF NOT EXISTS TG_nota_update BEFORE UPDATE
ON nota
FOR EACH ROW
BEGIN
    SET NEW.media = calcula_media(NEW.nota, NEW.peso, NEW.notamaxima);
END;
