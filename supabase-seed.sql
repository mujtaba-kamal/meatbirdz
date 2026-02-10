-- SQL script to seed menu items in Supabase
-- Run this in Supabase Dashboard → SQL Editor
-- Make sure tables are created first (run supabase-setup.sql)

-- Insert menu items (using cuid-like IDs)
INSERT INTO "MenuItem" (id, name, description, price, category, "available", "createdAt", "updatedAt") VALUES
-- BURGERS
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'Angus Classic', '4oz (2 patties). Fresh Premium Angus, double cheese, lettuce, caramelised onions, gherkins, house sauce', 7.99, 'burger', true, NOW(), NOW()),
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'The Angus Three', '6oz (3 patties). Fresh Premium Angus, triple cheese, lettuce, caramelised onions, gherkins, house sauce', 8.99, 'burger', true, NOW(), NOW()),
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'The Holy Angus', '8oz (4 patties). Fresh Premium Angus, quadruple cheese, lettuce, caramelised onions, gherkins, house sauce', 9.99, 'burger', true, NOW(), NOW()),
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'The Crispy Bird', 'Freshly prepared in-house marination. Crispy fried chicken, lettuce, house sauce, cheese', 6.99, 'burger', true, NOW(), NOW()),
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'The Big Bird', 'Freshly prepared in-house marination. Double crispy chicken fillet, double cheese, lettuce, house sauce', 7.99, 'burger', true, NOW(), NOW()),
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'Traditional Cheese ¼ Pounder', 'Lettuce, single cheese, mayonnaise, house sauce', 5.50, 'burger', true, NOW(), NOW()),
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'Traditional Cheese ½ Pounder', 'Lettuce, double cheese, mayonnaise, house sauce', 6.00, 'burger', true, NOW(), NOW()),
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'The Grilled Bird', 'Freshly prepared in-house marination. Chargrilled chicken, cheese, lettuce, house sauce', 7.50, 'burger', true, NOW(), NOW()),
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'The Double Grilled Bird', 'Freshly prepared in-house marination. Chargrilled chicken, double cheese, lettuce, house sauce', 8.50, 'burger', true, NOW(), NOW()),

-- WRAPS
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'The Meat Hex', 'Fresh angus, caramelised onions, lettuce, house sauce, 100% mozzarella cheese', 8.49, 'wrap', true, NOW(), NOW()),
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'The Crispy Bird Hex', 'Freshly prepared in-house marination. Crispy fried chicken, lettuce, house sauce, 100% mozzarella cheese', 7.49, 'wrap', true, NOW(), NOW()),
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'The Grilled Bird Hex', 'Freshly prepared in-house marination. Chargrilled chicken, cheese, lettuce, 100% mozzarella cheese, house sauce', 8.29, 'wrap', true, NOW(), NOW()),

-- FRIES
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'Skin Fries - Regular', 'Crispy skin-on fries', 2.50, 'fries', true, NOW(), NOW()),
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'Skin Fries - Large', 'Large portion of crispy skin-on fries', 3.00, 'fries', true, NOW(), NOW()),
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'Piri Fries - Regular', 'Spicy peri-peri seasoned fries', 2.75, 'fries', true, NOW(), NOW()),
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'Piri Fries - Large', 'Large portion of spicy peri-peri seasoned fries', 3.50, 'fries', true, NOW(), NOW()),
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'Crispy Chicken Tenders - 3pc', '3 pieces of crispy chicken tenders', 4.99, 'fries', true, NOW(), NOW()),
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'Crispy Chicken Tenders - 6pc', '6 pieces of crispy chicken tenders', 6.99, 'fries', true, NOW(), NOW()),
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'Crispy Chicken Tenders - 9pc', '9 pieces of crispy chicken tenders', 8.99, 'fries', true, NOW(), NOW()),
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'Crispy Chicken Tenders - 12pc', '12 pieces of crispy chicken tenders', 11.99, 'fries', true, NOW(), NOW()),
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'Chargrilled Tenders - 3pc', '3 pieces of chargrilled chicken tenders', 5.99, 'fries', true, NOW(), NOW()),
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'Chargrilled Tenders - 6pc', '6 pieces of chargrilled chicken tenders', 7.99, 'fries', true, NOW(), NOW()),
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'Chargrilled Tenders - 9pc', '9 pieces of chargrilled chicken tenders', 9.99, 'fries', true, NOW(), NOW()),
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'Chargrilled Tenders - 12pc', '12 pieces of chargrilled chicken tenders', 12.99, 'fries', true, NOW(), NOW()),

-- LOADED FRIES
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'The Big Smash Up', 'Skin on fries, Fresh Angus, melted cheese, house sauce', 8.49, 'fries', true, NOW(), NOW()),
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'The Dirty Bird', 'Skin on fries, crispy chicken, melted cheese, house sauce', 7.00, 'fries', true, NOW(), NOW()),
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'Chargrill Chicken Loaded Fries', 'Skin on fries, in-house marinated chargrilled chicken, melted cheese, house & peri sauce', 8.49, 'fries', true, NOW(), NOW()),
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'Spicy Cheese Loaded Fries', 'Skin on fries, melted cheese, cheese sauce, house sauce, jalapeños', 5.00, 'fries', true, NOW(), NOW()),

-- BOXES
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'The Classic Box', 'Choice burger (Angus Classic or The Crispy Bird), loaded fries topped with crispy chicken (add on £2.00 for Angus), 3 crispy chicken strips, can drink of choice, 2 dips', 12.99, 'burger', true, NOW(), NOW()),
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'The Buddy Box', 'Choice of 2 burgers (Angus Classic or The Crispy Bird), loaded fries with crispy chicken (add on £2.00 for Angus), 6 crispy chicken strips, can drink of choice, 2 dips', 17.99, 'burger', true, NOW(), NOW()),
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'The House Box', 'Choice of 4 burgers (Angus Classic or The Crispy Bird), loaded fries with crispy chicken (add on £2.00 for Angus), 12 crispy chicken strips, 4 cans, 8 dips', 35.00, 'burger', true, NOW(), NOW()),
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'The Char-Flame Box', 'Chargrilled Burger (make it a double £1.50), loaded chargrill fries, 3 chargrilled strips, can of choice, 2 dips', 13.99, 'burger', true, NOW(), NOW()),
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'The HexWrap Box', 'Choice of Hex Wrap, loaded fries with crispy chicken (add on Angus beef £2.00), 3 crispy chicken strips, can of choice, 2 dips', 13.99, 'wrap', true, NOW(), NOW()),

-- DRINKS
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'Ice Cola (330ml)', 'Refreshing ice cola', 1.50, 'drink', true, NOW(), NOW()),
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'Ice Pro Max Diet (330ml)', 'Diet cola drink', 1.50, 'drink', true, NOW(), NOW()),
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'Water (250ml/500ml)', 'Bottled water', 1.00, 'drink', true, NOW(), NOW()),
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'Rubicon Mango', 'Mango flavored drink', 1.50, 'drink', true, NOW(), NOW()),
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'Rubicon Passion', 'Passion fruit flavored drink', 1.50, 'drink', true, NOW(), NOW()),
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'Ice Mojito', 'Mint mojito flavored drink', 1.50, 'drink', true, NOW(), NOW()),

-- DIPS
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'Signature Sauce', 'Our signature house sauce', 1.00, 'drink', true, NOW(), NOW()),
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'Garlic Mayo', 'Creamy garlic mayonnaise', 1.00, 'drink', true, NOW(), NOW()),
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'Chilli Sauce', 'Spicy chilli sauce', 1.00, 'drink', true, NOW(), NOW()),
('clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'Cheese Sauce', 'Creamy cheese sauce', 1.00, 'drink', true, NOW(), NOW());
