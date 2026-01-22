-- Database: inventory_system
CREATE DATABASE IF NOT EXISTS inventory_system;
USE inventory_system;

-- Parent Tables
CREATE TABLE Role (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT
);

CREATE TABLE Category (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE Supplier (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(100)
);

-- Main Tables
CREATE TABLE User (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role_id INT,
    FOREIGN KEY (role_id) REFERENCES Role(id)
);

CREATE TABLE Item (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    quantity INT DEFAULT 0,
    price DECIMAL(10, 2),
    category_id INT,
    user_id INT,
    FOREIGN KEY (category_id) REFERENCES Category(id),
    FOREIGN KEY (user_id) REFERENCES User(id)
);

-- Transaction Tables
CREATE TABLE Inventory_Transaction (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT,
    user_id INT,
    quantity INT,
    type ENUM('IN', 'OUT'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES Item(id),
    FOREIGN KEY (user_id) REFERENCES User(id)
);