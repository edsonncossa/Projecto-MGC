-- ============================================
-- INSERTS: UNIT
-- ============================================
INSERT INTO UNIT (NAME, SYMBOL, DESCRIPTION) VALUES
('Unidade', 'UN', 'Unidade padrão'),
('Pacote', 'PK', 'Pacote com múltiplas unidades'),
('Caixa', 'CX', 'Caixa com várias unidades'),
('Folha', 'FL', 'Folha individual'),
('Litro', 'L', 'Unidade de volume'),
('Quilograma', 'KG', 'Unidade de peso');

-- ============================================
-- INSERTS: CATEGORY
-- ============================================
INSERT INTO CATEGORY (NAME, DESCRIPTION) VALUES
('Papelaria Básica', 'Papel, cadernos, agendas'),
('Material de Escrita', 'Canetas, lápis, marcadores'),
('Higiene e Limpeza', 'Sabonetes, álcool gel, toalhas'),
('Bebidas e Snacks', 'Para venda na cantina ou loja'),
('Organização', 'Pastas, envelopes, arquivos');

-- ============================================
-- INSERTS: PRODUCT
-- ============================================
INSERT INTO PRODUCT (NAME, DESCRIPTION, UNIT_PRICE, CATEGORY_ID, BASE_UNIT_ID, REFERENCE) VALUES
('Caderno A4 100 Folhas', 'Caderno pautado A4, 100 folhas', 150.00, 1, 4, 'PROD-0001'),
('Lápis HB', 'Lápis grafite HB', 10.00, 2, 1, 'PROD-0002'),
('Caneta Azul', 'Caneta esferográfica azul', 8.00, 2, 1, 'PROD-0003'),
('Marcador Permanente', 'Marcador permanente preto', 25.00, 2, 1, 'PROD-0004'),
('Papel Sulfite A4', 'Pacote 500 folhas', 350.00, 1, 2, 'PROD-0005'),
('Álcool Gel 70%', 'Álcool gel 70% 500ml', 120.00, 3, 5, 'PROD-0006'),
('Pastas Suspensas', 'Pacote com 10 pastas suspensas', 200.00, 5, 2, 'PROD-0007'),
('Envelope Carta', 'Pacote com 50 envelopes carta', 80.00, 5, 2, 'PROD-0008'),
('Borracha Escolar', 'Borracha branca macia', 5.00, 2, 1, 'PROD-0009'),
('Apontador Simples', 'Apontador plástico', 15.00, 2, 1, 'PROD-0010');

-- ============================================
-- INSERTS: PRODUCT_UNIT_CONVERSION
-- ============================================
INSERT INTO PRODUCT_UNIT_CONVERSION (PRODUCT_ID, UNIT_ID, CONVERSION_FACTOR) VALUES
(5, 4, 500), -- Papel Sulfite: 1 pacote = 500 folhas
(7, 2, 10),  -- Pastas Suspensas: 1 pacote = 10 unidades
(8, 2, 50);  -- Envelope Carta: 1 pacote = 50 unidades

-- ============================================
-- INSERTS: STOCK
-- ============================================
INSERT INTO STOCK (PRODUCT_ID, QUANTITY) VALUES
(1, 120),
(2, 500),
(3, 400),
(4, 150),
(5, 50),
(6, 80),
(7, 30),
(8, 60),
(9, 250),
(10, 200);

-- ============================================
-- INSERTS: STOCK_MOVEMENT
-- ============================================
INSERT INTO STOCK_MOVEMENT (STOCK_ID, MOVEMENT_TYPE, QUANTITY, UNIT_SYMBOL, OBSERVATION) VALUES
(1, 'ENTRY', 120, 'UN', 'Entrada inicial'),
(2, 'ENTRY', 500, 'UN', 'Entrada inicial'),
(3, 'ENTRY', 400, 'UN', 'Entrada inicial'),
(4, 'ENTRY', 150, 'UN', 'Entrada inicial'),
(5, 'ENTRY', 50, 'PK', 'Entrada inicial'),
(6, 'ENTRY', 80, 'L', 'Entrada inicial'),
(7, 'ENTRY', 30, 'PK', 'Entrada inicial'),
(8, 'ENTRY', 60, 'PK', 'Entrada inicial'),
(9, 'ENTRY', 250, 'UN', 'Entrada inicial'),
(10, 'ENTRY', 200, 'UN', 'Entrada inicial');