CREATE DATABASE IF NOT EXISTS mindflow
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mindflow;

CREATE TABLE usuario (
  id_usuario INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(100) NOT NULL,
  data_nascimento DATE NOT NULL,
  email VARCHAR(150) NOT NULL,
  senha VARCHAR(255) NOT NULL,
  PRIMARY KEY (id_usuario),
  CONSTRAINT uq_usuario_email UNIQUE (email)
) ENGINE = InnoDB;

CREATE TABLE especialidade (
  id_especialidade INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(100) NOT NULL,
  PRIMARY KEY (id_especialidade)
) ENGINE = InnoDB;

CREATE TABLE diario_emocional (
  id_diario INT NOT NULL AUTO_INCREMENT,
  id_usuario INT NOT NULL,
  PRIMARY KEY (id_diario),
  CONSTRAINT uq_diario_usuario UNIQUE (id_usuario),
  CONSTRAINT fk_diario_usuario
    FOREIGN KEY (id_usuario)
    REFERENCES usuario (id_usuario)
    ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE profissional (
  id_profissional INT NOT NULL AUTO_INCREMENT,
  id_especialidade INT NOT NULL,
  nome VARCHAR(100) NOT NULL,
  crp VARCHAR(20) NOT NULL,
  PRIMARY KEY (id_profissional),
  CONSTRAINT fk_profissional_especialidade
    FOREIGN KEY (id_especialidade)
    REFERENCES especialidade (id_especialidade)
    ON DELETE RESTRICT
) ENGINE = InnoDB;

CREATE TABLE compromisso (
  id_compromisso INT NOT NULL AUTO_INCREMENT,
  id_usuario INT NOT NULL,
  data DATE NOT NULL,
  horario TIME NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  PRIMARY KEY (id_compromisso),
  CONSTRAINT fk_compromisso_usuario
    FOREIGN KEY (id_usuario)
    REFERENCES usuario (id_usuario)
    ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE atendimento (
  id_atendimento INT NOT NULL AUTO_INCREMENT,
  id_usuario INT NOT NULL,
  id_profissional INT NOT NULL,
  data_inicio DATE NOT NULL,
  PRIMARY KEY (id_atendimento),
  CONSTRAINT fk_atendimento_usuario
    FOREIGN KEY (id_usuario)
    REFERENCES usuario (id_usuario)
    ON DELETE CASCADE,
  CONSTRAINT fk_atendimento_profissional
    FOREIGN KEY (id_profissional)
    REFERENCES profissional (id_profissional)
    ON DELETE RESTRICT
) ENGINE = InnoDB;

CREATE TABLE registro_emocional (
  id_registro INT NOT NULL AUTO_INCREMENT,
  id_diario INT NOT NULL,
  data DATE NOT NULL,
  horario TIME NOT NULL,
  emocao VARCHAR(50) NOT NULL,
  anotacao TEXT,
  PRIMARY KEY (id_registro),
  CONSTRAINT fk_registro_diario
    FOREIGN KEY (id_diario)
    REFERENCES diario_emocional (id_diario)
    ON DELETE CASCADE
) ENGINE = InnoDB;
