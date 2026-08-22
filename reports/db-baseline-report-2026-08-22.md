# KimsRecipe DB Baseline Report

- Generated at: 2026-08-22T07:59:59.563Z
- Query mode: read-only metadata/count checks
- Secrets: DB password/JWT secret/env values intentionally omitted

## 1. DB Version And Database

- SELECT VERSION(): `8.0.43`
- SELECT DATABASE(): `kimsrecipe`

## 2. SHOW TABLES

```sql
SHOW TABLES;
```

| # | Table |
|---:|---|
| 1 | addresses |
| 2 | cart_items |
| 3 | carts |
| 4 | categories |
| 5 | home_party_categories |
| 6 | home_party_menus |
| 7 | home_party_reservation_items |
| 8 | home_party_reservation_status_logs |
| 9 | home_party_reservations |
| 10 | home_party_set_items |
| 11 | home_party_sets |
| 12 | order_items |
| 13 | orders |
| 14 | payments |
| 15 | storemenus |
| 16 | stores |
| 17 | users |
| 18 | wishlists |

## 3. Table Structure Summary

| Table | Expected role | Row count | PK | FK | UNIQUE | CHECK | INDEX | Engine | Charset/Collation |
|---|---|---:|---|---|---|---|---|---|---|
| addresses | User delivery addresses and default address flag | 1 | addressId | CONSTRAINT `fk_addresses_user` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE |  |  | idx_addresses_user(userId); idx_addresses_user_default(userId, isDefault) | InnoDB | utf8mb4/utf8mb4_0900_ai_ci |
| cart_items | Menu items in carts | 6 | cartItemId | CONSTRAINT `fk_cart_items_cart` FOREIGN KEY (`cartId`) REFERENCES `carts` (`cartId`) ON DELETE CASCADE; CONSTRAINT `fk_cart_items_storemenu` FOREIGN KEY (`storeMenuId`) REFERENCES `storemenus` (`storeMenuId`) ON DELETE RESTRICT | uq_cart_food(cartId, storeMenuId) |  | fk_cart_items_storemenu(storeMenuId) | InnoDB | utf8mb4/utf8mb4_0900_ai_ci |
| carts | One cart header per user | 2 | cartId | CONSTRAINT `fk_carts_store` FOREIGN KEY (`storeId`) REFERENCES `stores` (`storeId`) ON DELETE CASCADE; CONSTRAINT `fk_carts_user` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE | uq_user_cart(userId) |  | fk_carts_store(storeId) | InnoDB | utf8mb4/utf8mb4_0900_ai_ci |
| categories | Regular menu categories | 4 | categoryId | CONSTRAINT `fk_categories_store` FOREIGN KEY (`storeId`) REFERENCES `stores` (`storeId`) ON DELETE CASCADE |  |  | fk_categories_store(storeId) | InnoDB | utf8mb4/utf8mb4_0900_ai_ci |
| home_party_categories | Home-party menu categories | 4 | hpCategoryId |  |  |  | idx_hpc_store_visible_sort(storeId, isVisible, sortOrder) | InnoDB | utf8mb4/utf8mb4_0900_ai_ci |
| home_party_menus | Home-party menu master | 8 | hpMenuId | CONSTRAINT `fk_hpm_category` FOREIGN KEY (`hpCategoryId`) REFERENCES `home_party_categories` (`hpCategoryId`) ON DELETE RESTRICT ON UPDATE CASCADE |  |  | idx_hpm_store_category(storeId, hpCategoryId); idx_hpm_store_status(storeId, menuStatus); fk_hpm_category(hpCategoryId) | InnoDB | utf8mb4/utf8mb4_0900_ai_ci |
| home_party_reservation_items | Home-party reservation item snapshot | 0 | reservationItemId | CONSTRAINT `fk_home_party_reservation_items_menu` FOREIGN KEY (`hpMenuId`) REFERENCES `storemenus` (`storeMenuId`) ON DELETE SET NULL; CONSTRAINT `fk_home_party_reservation_items_reservation` FOREIGN KEY (`reservationId`) REFERENCES `home_party_reservations` (`reservationId`) ON DELETE CASCADE |  |  | fk_home_party_reservation_items_reservation(reservationId); fk_home_party_reservation_items_menu(hpMenuId) | InnoDB | utf8mb4/utf8mb4_0900_ai_ci |
| home_party_reservation_status_logs | Home-party reservation status audit log | 0 | logId | CONSTRAINT `fk_hprsl_reservation` FOREIGN KEY (`reservationId`) REFERENCES `home_party_reservations` (`reservationId`) ON DELETE CASCADE ON UPDATE CASCADE |  |  | idx_hprsl_reservation(reservationId) | InnoDB | utf8mb4/utf8mb4_0900_ai_ci |
| home_party_reservations | Home-party reservation header | 0 | reservationId | CONSTRAINT `fk_home_party_reservations_set` FOREIGN KEY (`baseSetId`) REFERENCES `home_party_sets` (`setId`) ON DELETE SET NULL; CONSTRAINT `fk_home_party_reservations_store` FOREIGN KEY (`storeId`) REFERENCES `stores` (`storeId`) ON DELETE CASCADE; CONSTRAINT `fk_home_party_reservations_user` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE |  |  | fk_home_party_reservations_user(userId); fk_home_party_reservations_store(storeId); fk_home_party_reservations_set(baseSetId) | InnoDB | utf8mb4/utf8mb4_0900_ai_ci |
| home_party_set_items | Recommended home-party set composition | 3 | setItemId | CONSTRAINT `fk_home_party_set_items_menu` FOREIGN KEY (`hpMenuId`) REFERENCES `storemenus` (`storeMenuId`) ON DELETE CASCADE; CONSTRAINT `fk_home_party_set_items_set` FOREIGN KEY (`setId`) REFERENCES `home_party_sets` (`setId`) ON DELETE CASCADE |  |  | fk_home_party_set_items_set(setId); fk_home_party_set_items_menu(hpMenuId) | InnoDB | utf8mb4/utf8mb4_0900_ai_ci |
| home_party_sets | Recommended home-party set headers | 2 | setId | CONSTRAINT `fk_home_party_sets_store` FOREIGN KEY (`storeId`) REFERENCES `stores` (`storeId`) ON DELETE CASCADE |  |  | fk_home_party_sets_store(storeId) | InnoDB | utf8mb4/utf8mb4_0900_ai_ci |
| order_items | Regular order item snapshot | 0 | orderItemId | CONSTRAINT `fk_order_items_menu` FOREIGN KEY (`storeMenuId`) REFERENCES `storemenus` (`storeMenuId`) ON DELETE RESTRICT; CONSTRAINT `fk_order_items_order` FOREIGN KEY (`orderId`) REFERENCES `orders` (`orderId`) ON DELETE CASCADE |  |  | idx_order_items_order(orderId); idx_order_items_menu(storeMenuId) | InnoDB | utf8mb4/utf8mb4_0900_ai_ci |
| orders | Regular order header and delivery/amount snapshot | 0 | orderId | CONSTRAINT `fk_orders_store` FOREIGN KEY (`storeId`) REFERENCES `stores` (`storeId`) ON DELETE RESTRICT; CONSTRAINT `fk_orders_user` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE RESTRICT |  |  | idx_orders_user(userId); idx_orders_status(status); idx_orders_store(storeId) | InnoDB | utf8mb4/utf8mb4_0900_ai_ci |
| payments | Payment records for regular orders | 0 | paymentId | CONSTRAINT `fk_payments_order` FOREIGN KEY (`orderId`) REFERENCES `orders` (`orderId`) ON DELETE RESTRICT; CONSTRAINT `fk_payments_user` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE RESTRICT | uq_payments_pg_tx(pgTransactionId) |  | fk_payments_user(userId); idx_payments_order(orderId); idx_payments_order_status(orderId, status) | InnoDB | utf8mb4/utf8mb4_0900_ai_ci |
| storemenus | Regular ordering menu master | 9 | storeMenuId | CONSTRAINT `fk_storemenus_category` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON DELETE RESTRICT; CONSTRAINT `fk_storemenus_store` FOREIGN KEY (`storeId`) REFERENCES `stores` (`storeId`) ON DELETE CASCADE |  |  | fk_storemenus_store(storeId); fk_storemenus_category(categoryId) | InnoDB | utf8mb4/utf8mb4_0900_ai_ci |
| stores | Store master data, minimum order amount, delivery fee | 2 | storeId |  |  |  |  | InnoDB | utf8mb4/utf8mb4_0900_ai_ci |
| users | User accounts, auth credentials, profile, points | 4 | userId |  |  |  |  | InnoDB | utf8mb4/utf8mb4_0900_ai_ci |
| wishlists | User saved menu items | 3 | wishlistId | CONSTRAINT `fk_wishlists_storemenu` FOREIGN KEY (`storeMenuId`) REFERENCES `storemenus` (`storeMenuId`); CONSTRAINT `fk_wishlists_user` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) | uniq_wishlist_user_menu(userId, storeMenuId) |  | fk_wishlists_storemenu(storeMenuId) | InnoDB | utf8mb4/utf8mb4_0900_ai_ci |

## 4. Row Counts

| Table | Count |
|---|---:|
| addresses | 1 |
| cart_items | 6 |
| carts | 2 |
| categories | 4 |
| home_party_categories | 4 |
| home_party_menus | 8 |
| home_party_reservation_items | 0 |
| home_party_reservation_status_logs | 0 |
| home_party_reservations | 0 |
| home_party_set_items | 3 |
| home_party_sets | 2 |
| order_items | 0 |
| orders | 0 |
| payments | 0 |
| storemenus | 9 |
| stores | 2 |
| users | 4 |
| wishlists | 3 |

## 5. Integrity Check Results

| Check | Count | Note |
|---|---:|---|
| orphan cart_items.cartId | 0 | OK |
| orphan cart_items.storeMenuId | 0 | OK |
| orphan order_items.orderId | 0 | OK |
| orphan order_items.storeMenuId | 0 | OK |
| orphan payments.orderId | 0 | OK |
| orphan payments.userId | 0 | OK |
| orphan addresses.userId | 0 | OK |
| duplicate users.username groups | 0 | OK |
| duplicate carts.userId groups | 0 | OK |
| duplicate cart_items(cartId, storeMenuId) groups | 0 | OK |
| duplicate wishlists(userId, storeMenuId) groups | 0 | OK |
| home_party_set_items.hpMenuId missing in home_party_menus | 0 | OK |
| home_party_reservation_items.hpMenuId missing in home_party_menus | 0 | OK |
| home_party_set_items.hpMenuId missing in current FK target storemenus | 0 | OK |
| home_party_reservation_items.hpMenuId missing in current FK target storemenus | 0 | OK |
| orders.totalPrice NULL rows | N/A | orders.totalPrice column does not exist |
| orders.totalAmount NULL rows | 0 | OK |
| orders.totalPrice vs totalAmount mismatch rows | N/A | one or both columns are absent |
| order total vs order_items subtotal mismatch rows | 0 | OK |
| paid payment amount vs order amount mismatch rows | 0 | OK |

### Integrity Check SQL

#### orphan cart_items.cartId
```sql
SELECT COUNT(*) cnt FROM cart_items ci LEFT JOIN carts c ON c.cartId=ci.cartId WHERE c.cartId IS NULL
```

#### orphan cart_items.storeMenuId
```sql
SELECT COUNT(*) cnt FROM cart_items ci LEFT JOIN storemenus sm ON sm.storeMenuId=ci.storeMenuId WHERE sm.storeMenuId IS NULL
```

#### orphan order_items.orderId
```sql
SELECT COUNT(*) cnt FROM order_items oi LEFT JOIN orders o ON o.orderId=oi.orderId WHERE o.orderId IS NULL
```

#### orphan order_items.storeMenuId
```sql
SELECT COUNT(*) cnt FROM order_items oi LEFT JOIN storemenus sm ON sm.storeMenuId=oi.storeMenuId WHERE sm.storeMenuId IS NULL
```

#### orphan payments.orderId
```sql
SELECT COUNT(*) cnt FROM payments p LEFT JOIN orders o ON o.orderId=p.orderId WHERE o.orderId IS NULL
```

#### orphan payments.userId
```sql
SELECT COUNT(*) cnt FROM payments p LEFT JOIN users u ON u.userId=p.userId WHERE u.userId IS NULL
```

#### orphan addresses.userId
```sql
SELECT COUNT(*) cnt FROM addresses a LEFT JOIN users u ON u.userId=a.userId WHERE u.userId IS NULL
```

#### duplicate users.username groups
```sql
SELECT COUNT(*) cnt FROM (SELECT username FROM users GROUP BY username HAVING COUNT(*)>1) d
```

#### duplicate carts.userId groups
```sql
SELECT COUNT(*) cnt FROM (SELECT userId FROM carts GROUP BY userId HAVING COUNT(*)>1) d
```

#### duplicate cart_items(cartId, storeMenuId) groups
```sql
SELECT COUNT(*) cnt FROM (SELECT cartId, storeMenuId FROM cart_items GROUP BY cartId,storeMenuId HAVING COUNT(*)>1) d
```

#### duplicate wishlists(userId, storeMenuId) groups
```sql
SELECT COUNT(*) cnt FROM (SELECT userId, storeMenuId FROM wishlists GROUP BY userId,storeMenuId HAVING COUNT(*)>1) d
```

#### home_party_set_items.hpMenuId missing in home_party_menus
```sql
SELECT COUNT(*) cnt FROM home_party_set_items hpsi LEFT JOIN home_party_menus hpm ON hpm.hpMenuId=hpsi.hpMenuId WHERE hpm.hpMenuId IS NULL
```

#### home_party_reservation_items.hpMenuId missing in home_party_menus
```sql
SELECT COUNT(*) cnt FROM home_party_reservation_items hpri LEFT JOIN home_party_menus hpm ON hpm.hpMenuId=hpri.hpMenuId WHERE hpri.hpMenuId IS NOT NULL AND hpm.hpMenuId IS NULL
```

#### home_party_set_items.hpMenuId missing in current FK target storemenus
```sql
SELECT COUNT(*) cnt FROM home_party_set_items hpsi LEFT JOIN storemenus sm ON sm.storeMenuId=hpsi.hpMenuId WHERE sm.storeMenuId IS NULL
```

#### home_party_reservation_items.hpMenuId missing in current FK target storemenus
```sql
SELECT COUNT(*) cnt FROM home_party_reservation_items hpri LEFT JOIN storemenus sm ON sm.storeMenuId=hpri.hpMenuId WHERE hpri.hpMenuId IS NOT NULL AND sm.storeMenuId IS NULL
```

#### orders.totalPrice NULL rows
```sql
information_schema.columns check
```

#### orders.totalAmount NULL rows
```sql
SELECT COUNT(*) cnt FROM orders WHERE totalAmount IS NULL
```

#### orders.totalPrice vs totalAmount mismatch rows
```sql
information_schema.columns check
```

#### order total vs order_items subtotal mismatch rows
```sql
SELECT COUNT(*) cnt FROM orders o LEFT JOIN (SELECT orderId,SUM(price*quantity) itemSubtotal FROM order_items GROUP BY orderId) oi ON oi.orderId=o.orderId WHERE COALESCE(oi.itemSubtotal,0)<>(o.totalAmount+COALESCE(o.pointsUsed,0)-COALESCE(o.deliveryFee,0))
```

#### paid payment amount vs order amount mismatch rows
```sql
SELECT COUNT(*) cnt FROM payments p JOIN orders o ON o.orderId=p.orderId WHERE p.status="PAID" AND p.amount<>o.totalAmount
```

## 6. Raw SHOW CREATE TABLE

### addresses (required)
```sql
CREATE TABLE `addresses` (
  `addressId` bigint unsigned NOT NULL AUTO_INCREMENT,
  `userId` bigint unsigned NOT NULL,
  `label` varchar(30) DEFAULT NULL,
  `recipientName` varchar(50) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `postalCode` varchar(10) DEFAULT NULL,
  `addressLine1` varchar(255) NOT NULL,
  `addressLine2` varchar(255) DEFAULT NULL,
  `isDefault` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`addressId`),
  KEY `idx_addresses_user` (`userId`),
  KEY `idx_addresses_user_default` (`userId`,`isDefault`),
  CONSTRAINT `fk_addresses_user` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

### cart_items (required)
```sql
CREATE TABLE `cart_items` (
  `cartItemId` bigint unsigned NOT NULL AUTO_INCREMENT,
  `cartId` bigint unsigned NOT NULL,
  `storeMenuId` bigint unsigned NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`cartItemId`),
  UNIQUE KEY `uq_cart_food` (`cartId`,`storeMenuId`),
  KEY `fk_cart_items_storemenu` (`storeMenuId`),
  CONSTRAINT `fk_cart_items_cart` FOREIGN KEY (`cartId`) REFERENCES `carts` (`cartId`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_items_storemenu` FOREIGN KEY (`storeMenuId`) REFERENCES `storemenus` (`storeMenuId`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=99 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

### carts (required)
```sql
CREATE TABLE `carts` (
  `cartId` bigint unsigned NOT NULL AUTO_INCREMENT,
  `userId` bigint unsigned NOT NULL,
  `storeId` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`cartId`),
  UNIQUE KEY `uq_user_cart` (`userId`),
  KEY `fk_carts_store` (`storeId`),
  CONSTRAINT `fk_carts_store` FOREIGN KEY (`storeId`) REFERENCES `stores` (`storeId`) ON DELETE CASCADE,
  CONSTRAINT `fk_carts_user` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

### categories (required)
```sql
CREATE TABLE `categories` (
  `categoryId` int NOT NULL AUTO_INCREMENT,
  `storeId` bigint unsigned NOT NULL,
  `categoryName` varchar(100) NOT NULL,
  `isVisible` tinyint(1) NOT NULL DEFAULT '1',
  `sortOrder` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`categoryId`),
  KEY `fk_categories_store` (`storeId`),
  CONSTRAINT `fk_categories_store` FOREIGN KEY (`storeId`) REFERENCES `stores` (`storeId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

### home_party_categories (required)
```sql
CREATE TABLE `home_party_categories` (
  `hpCategoryId` bigint unsigned NOT NULL AUTO_INCREMENT,
  `storeId` bigint unsigned NOT NULL,
  `categoryName` varchar(100) NOT NULL,
  `sortOrder` int NOT NULL DEFAULT '0',
  `isVisible` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`hpCategoryId`),
  KEY `idx_hpc_store_visible_sort` (`storeId`,`isVisible`,`sortOrder`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

### home_party_menus (required)
```sql
CREATE TABLE `home_party_menus` (
  `hpMenuId` bigint unsigned NOT NULL AUTO_INCREMENT,
  `storeId` bigint unsigned NOT NULL,
  `hpCategoryId` bigint unsigned NOT NULL,
  `menuName` varchar(150) NOT NULL,
  `price` int NOT NULL,
  `imageUrl` varchar(500) DEFAULT NULL,
  `amount` varchar(100) DEFAULT NULL,
  `menuStatus` enum('ON_SALE','SOLD_OUT','HIDDEN') NOT NULL DEFAULT 'ON_SALE',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`hpMenuId`),
  KEY `idx_hpm_store_category` (`storeId`,`hpCategoryId`),
  KEY `idx_hpm_store_status` (`storeId`,`menuStatus`),
  KEY `fk_hpm_category` (`hpCategoryId`),
  CONSTRAINT `fk_hpm_category` FOREIGN KEY (`hpCategoryId`) REFERENCES `home_party_categories` (`hpCategoryId`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

### home_party_reservation_items (required)
```sql
CREATE TABLE `home_party_reservation_items` (
  `reservationItemId` bigint unsigned NOT NULL AUTO_INCREMENT,
  `reservationId` bigint unsigned NOT NULL,
  `hpMenuId` bigint unsigned DEFAULT NULL,
  `customName` varchar(100) DEFAULT NULL,
  `quantity` int NOT NULL,
  `unitPrice` int NOT NULL,
  `lineTotal` int NOT NULL,
  `menuNameSnapshot` varchar(100) NOT NULL,
  `imageUrlSnapshot` varchar(255) DEFAULT NULL,
  `optionsJson` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`reservationItemId`),
  KEY `fk_home_party_reservation_items_reservation` (`reservationId`),
  KEY `fk_home_party_reservation_items_menu` (`hpMenuId`),
  CONSTRAINT `fk_home_party_reservation_items_menu` FOREIGN KEY (`hpMenuId`) REFERENCES `storemenus` (`storeMenuId`) ON DELETE SET NULL,
  CONSTRAINT `fk_home_party_reservation_items_reservation` FOREIGN KEY (`reservationId`) REFERENCES `home_party_reservations` (`reservationId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

### home_party_reservation_status_logs (required)
```sql
CREATE TABLE `home_party_reservation_status_logs` (
  `logId` bigint unsigned NOT NULL AUTO_INCREMENT,
  `reservationId` bigint unsigned NOT NULL,
  `fromStatus` enum('DRAFT','CONFIRMED','CANCELLED') DEFAULT NULL,
  `toStatus` enum('DRAFT','CONFIRMED','CANCELLED') NOT NULL,
  `actorType` enum('USER','ADMIN','SYSTEM') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`logId`),
  KEY `idx_hprsl_reservation` (`reservationId`),
  CONSTRAINT `fk_hprsl_reservation` FOREIGN KEY (`reservationId`) REFERENCES `home_party_reservations` (`reservationId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

### home_party_reservations (required)
```sql
CREATE TABLE `home_party_reservations` (
  `reservationId` bigint unsigned NOT NULL AUTO_INCREMENT,
  `userId` bigint unsigned NOT NULL,
  `storeId` bigint unsigned NOT NULL,
  `status` enum('DRAFT','PAID','APPROVED','REJECTED','COOKING','COMPLETED','CANCELLED_BY_USER') NOT NULL DEFAULT 'DRAFT',
  `eventType` varchar(30) NOT NULL,
  `headcount` int NOT NULL,
  `eventDateTime` datetime NOT NULL,
  `preferenceJson` json DEFAULT NULL,
  `requestNote` varchar(255) DEFAULT NULL,
  `depositAmount` int NOT NULL,
  `finalAmount` int NOT NULL,
  `adminDecisionReason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `sourceType` enum('FROM_SET','CUSTOM') NOT NULL DEFAULT 'FROM_SET',
  `baseSetId` bigint unsigned DEFAULT NULL,
  `pickupDateTime` datetime NOT NULL,
  PRIMARY KEY (`reservationId`),
  KEY `fk_home_party_reservations_user` (`userId`),
  KEY `fk_home_party_reservations_store` (`storeId`),
  KEY `fk_home_party_reservations_set` (`baseSetId`),
  CONSTRAINT `fk_home_party_reservations_set` FOREIGN KEY (`baseSetId`) REFERENCES `home_party_sets` (`setId`) ON DELETE SET NULL,
  CONSTRAINT `fk_home_party_reservations_store` FOREIGN KEY (`storeId`) REFERENCES `stores` (`storeId`) ON DELETE CASCADE,
  CONSTRAINT `fk_home_party_reservations_user` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

### home_party_set_items (required)
```sql
CREATE TABLE `home_party_set_items` (
  `setItemId` bigint unsigned NOT NULL AUTO_INCREMENT,
  `setId` bigint unsigned NOT NULL,
  `hpMenuId` bigint unsigned NOT NULL,
  `quantity` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`setItemId`),
  KEY `fk_home_party_set_items_set` (`setId`),
  KEY `fk_home_party_set_items_menu` (`hpMenuId`),
  CONSTRAINT `fk_home_party_set_items_menu` FOREIGN KEY (`hpMenuId`) REFERENCES `storemenus` (`storeMenuId`) ON DELETE CASCADE,
  CONSTRAINT `fk_home_party_set_items_set` FOREIGN KEY (`setId`) REFERENCES `home_party_sets` (`setId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

### home_party_sets (required)
```sql
CREATE TABLE `home_party_sets` (
  `setId` bigint unsigned NOT NULL AUTO_INCREMENT,
  `storeId` bigint unsigned NOT NULL,
  `setName` varchar(100) NOT NULL,
  `imageUrl` varchar(2048) DEFAULT NULL,
  `basePrice` int NOT NULL,
  `recommendedMinHeadcount` int NOT NULL,
  `recommendedMaxHeadcount` int NOT NULL,
  `eventTagsJson` json DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setId`),
  KEY `fk_home_party_sets_store` (`storeId`),
  CONSTRAINT `fk_home_party_sets_store` FOREIGN KEY (`storeId`) REFERENCES `stores` (`storeId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

### order_items (required)
```sql
CREATE TABLE `order_items` (
  `orderItemId` bigint unsigned NOT NULL AUTO_INCREMENT,
  `orderId` bigint unsigned NOT NULL,
  `storeMenuId` bigint unsigned NOT NULL,
  `menuName` varchar(100) NOT NULL,
  `menuStatus` enum('ON_SALE','SOLD_OUT','HIDDEN') NOT NULL,
  `price` int NOT NULL,
  `quantity` int NOT NULL,
  `imageUrl` varchar(500) DEFAULT NULL,
  `amount` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`orderItemId`),
  KEY `idx_order_items_order` (`orderId`),
  KEY `idx_order_items_menu` (`storeMenuId`),
  CONSTRAINT `fk_order_items_menu` FOREIGN KEY (`storeMenuId`) REFERENCES `storemenus` (`storeMenuId`) ON DELETE RESTRICT,
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`orderId`) REFERENCES `orders` (`orderId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

### orders (required)
```sql
CREATE TABLE `orders` (
  `orderId` bigint unsigned NOT NULL AUTO_INCREMENT,
  `userId` bigint unsigned NOT NULL,
  `storeId` bigint unsigned NOT NULL,
  `status` enum('CREATED','PAID','CANCELED') NOT NULL DEFAULT 'CREATED',
  `deliveryRecipient` varchar(50) NOT NULL,
  `deliveryPhone` varchar(20) NOT NULL,
  `deliveryPostalCode` varchar(10) DEFAULT NULL,
  `deliveryAddress1` varchar(255) NOT NULL,
  `deliveryAddress2` varchar(255) NOT NULL,
  `deliveryRequest` varchar(500) DEFAULT NULL,
  `subtotalAmount` int NOT NULL,
  `deliveryFee` int NOT NULL,
  `pointsUsed` int NOT NULL DEFAULT '0',
  `totalAmount` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`orderId`),
  KEY `idx_orders_user` (`userId`),
  KEY `idx_orders_status` (`status`),
  KEY `idx_orders_store` (`storeId`),
  CONSTRAINT `fk_orders_store` FOREIGN KEY (`storeId`) REFERENCES `stores` (`storeId`) ON DELETE RESTRICT,
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

### payments (required)
```sql
CREATE TABLE `payments` (
  `paymentId` bigint unsigned NOT NULL AUTO_INCREMENT,
  `orderId` bigint unsigned NOT NULL,
  `userId` bigint unsigned NOT NULL,
  `status` enum('READY','PAID','FAILED') NOT NULL DEFAULT 'READY',
  `amount` int NOT NULL,
  `method` enum('CARD','KAKAO','TOSS','OTHER') NOT NULL,
  `pgTransactionId` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`paymentId`),
  UNIQUE KEY `uq_payments_pg_tx` (`pgTransactionId`),
  KEY `fk_payments_user` (`userId`),
  KEY `idx_payments_order` (`orderId`),
  KEY `idx_payments_order_status` (`orderId`,`status`),
  CONSTRAINT `fk_payments_order` FOREIGN KEY (`orderId`) REFERENCES `orders` (`orderId`) ON DELETE RESTRICT,
  CONSTRAINT `fk_payments_user` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

### storemenus (required)
```sql
CREATE TABLE `storemenus` (
  `storeMenuId` bigint unsigned NOT NULL AUTO_INCREMENT,
  `storeId` bigint unsigned NOT NULL,
  `categoryId` int NOT NULL,
  `menuName` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `price` int NOT NULL,
  `imageUrl` varchar(255) DEFAULT NULL,
  `popularity` int DEFAULT '0',
  `amount` varchar(45) NOT NULL,
  `menuStatus` enum('ON_SALE','SOLD_OUT','HIDDEN') NOT NULL DEFAULT 'ON_SALE',
  PRIMARY KEY (`storeMenuId`),
  KEY `fk_storemenus_store` (`storeId`),
  KEY `fk_storemenus_category` (`categoryId`),
  CONSTRAINT `fk_storemenus_category` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON DELETE RESTRICT,
  CONSTRAINT `fk_storemenus_store` FOREIGN KEY (`storeId`) REFERENCES `stores` (`storeId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

### stores (required)
```sql
CREATE TABLE `stores` (
  `storeId` bigint unsigned NOT NULL AUTO_INCREMENT,
  `storeName` varchar(100) NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `minOrderAmount` int NOT NULL DEFAULT '0',
  `baseDeliveryFee` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`storeId`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

### users (required)
```sql
CREATE TABLE `users` (
  `userId` bigint unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `name` varchar(45) NOT NULL,
  `userPoints` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`userId`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

### wishlists (required)
```sql
CREATE TABLE `wishlists` (
  `wishlistId` bigint unsigned NOT NULL AUTO_INCREMENT,
  `userId` bigint unsigned NOT NULL,
  `storeMenuId` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`wishlistId`),
  UNIQUE KEY `uniq_wishlist_user_menu` (`userId`,`storeMenuId`),
  KEY `fk_wishlists_storemenu` (`storeMenuId`),
  CONSTRAINT `fk_wishlists_storemenu` FOREIGN KEY (`storeMenuId`) REFERENCES `storemenus` (`storeMenuId`),
  CONSTRAINT `fk_wishlists_user` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

## 7. Raw SHOW INDEX

### addresses
| Table | Non_unique | Key_name | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
|---|---:|---|---:|---|---|---:|---|---|---|---|---|---|---|---|
| addresses | 0 | PRIMARY | 1 | addressId | A | 0 |  |  |  | BTREE |  |  | YES |  |
| addresses | 1 | idx_addresses_user | 1 | userId | A | 0 |  |  |  | BTREE |  |  | YES |  |
| addresses | 1 | idx_addresses_user_default | 1 | userId | A | 0 |  |  |  | BTREE |  |  | YES |  |
| addresses | 1 | idx_addresses_user_default | 2 | isDefault | A | 0 |  |  |  | BTREE |  |  | YES |  |

### cart_items
| Table | Non_unique | Key_name | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
|---|---:|---|---:|---|---|---:|---|---|---|---|---|---|---|---|
| cart_items | 0 | PRIMARY | 1 | cartItemId | A | 6 |  |  |  | BTREE |  |  | YES |  |
| cart_items | 0 | uq_cart_food | 1 | cartId | A | 2 |  |  |  | BTREE |  |  | YES |  |
| cart_items | 0 | uq_cart_food | 2 | storeMenuId | A | 6 |  |  |  | BTREE |  |  | YES |  |
| cart_items | 1 | fk_cart_items_storemenu | 1 | storeMenuId | A | 5 |  |  |  | BTREE |  |  | YES |  |

### carts
| Table | Non_unique | Key_name | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
|---|---:|---|---:|---|---|---:|---|---|---|---|---|---|---|---|
| carts | 0 | PRIMARY | 1 | cartId | A | 1 |  |  |  | BTREE |  |  | YES |  |
| carts | 0 | uq_user_cart | 1 | userId | A | 1 |  |  |  | BTREE |  |  | YES |  |
| carts | 1 | fk_carts_store | 1 | storeId | A | 1 |  |  |  | BTREE |  |  | YES |  |

### categories
| Table | Non_unique | Key_name | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
|---|---:|---|---:|---|---|---:|---|---|---|---|---|---|---|---|
| categories | 0 | PRIMARY | 1 | categoryId | A | 4 |  |  |  | BTREE |  |  | YES |  |
| categories | 1 | fk_categories_store | 1 | storeId | A | 2 |  |  |  | BTREE |  |  | YES |  |

### home_party_categories
| Table | Non_unique | Key_name | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
|---|---:|---|---:|---|---|---:|---|---|---|---|---|---|---|---|
| home_party_categories | 0 | PRIMARY | 1 | hpCategoryId | A | 5 |  |  |  | BTREE |  |  | YES |  |
| home_party_categories | 1 | idx_hpc_store_visible_sort | 1 | storeId | A | 1 |  |  |  | BTREE |  |  | YES |  |
| home_party_categories | 1 | idx_hpc_store_visible_sort | 2 | isVisible | A | 1 |  |  |  | BTREE |  |  | YES |  |
| home_party_categories | 1 | idx_hpc_store_visible_sort | 3 | sortOrder | A | 5 |  |  |  | BTREE |  |  | YES |  |

### home_party_menus
| Table | Non_unique | Key_name | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
|---|---:|---|---:|---|---|---:|---|---|---|---|---|---|---|---|
| home_party_menus | 0 | PRIMARY | 1 | hpMenuId | A | 8 |  |  |  | BTREE |  |  | YES |  |
| home_party_menus | 1 | idx_hpm_store_category | 1 | storeId | A | 1 |  |  |  | BTREE |  |  | YES |  |
| home_party_menus | 1 | idx_hpm_store_category | 2 | hpCategoryId | A | 3 |  |  |  | BTREE |  |  | YES |  |
| home_party_menus | 1 | idx_hpm_store_status | 1 | storeId | A | 1 |  |  |  | BTREE |  |  | YES |  |
| home_party_menus | 1 | idx_hpm_store_status | 2 | menuStatus | A | 2 |  |  |  | BTREE |  |  | YES |  |
| home_party_menus | 1 | fk_hpm_category | 1 | hpCategoryId | A | 3 |  |  |  | BTREE |  |  | YES |  |

### home_party_reservation_items
| Table | Non_unique | Key_name | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
|---|---:|---|---:|---|---|---:|---|---|---|---|---|---|---|---|
| home_party_reservation_items | 0 | PRIMARY | 1 | reservationItemId | A | 0 |  |  |  | BTREE |  |  | YES |  |
| home_party_reservation_items | 1 | fk_home_party_reservation_items_reservation | 1 | reservationId | A | 0 |  |  |  | BTREE |  |  | YES |  |
| home_party_reservation_items | 1 | fk_home_party_reservation_items_menu | 1 | hpMenuId | A | 0 |  |  | YES | BTREE |  |  | YES |  |

### home_party_reservation_status_logs
| Table | Non_unique | Key_name | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
|---|---:|---|---:|---|---|---:|---|---|---|---|---|---|---|---|
| home_party_reservation_status_logs | 0 | PRIMARY | 1 | logId | A | 0 |  |  |  | BTREE |  |  | YES |  |
| home_party_reservation_status_logs | 1 | idx_hprsl_reservation | 1 | reservationId | A | 0 |  |  |  | BTREE |  |  | YES |  |

### home_party_reservations
| Table | Non_unique | Key_name | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
|---|---:|---|---:|---|---|---:|---|---|---|---|---|---|---|---|
| home_party_reservations | 0 | PRIMARY | 1 | reservationId | A | 0 |  |  |  | BTREE |  |  | YES |  |
| home_party_reservations | 1 | fk_home_party_reservations_user | 1 | userId | A | 0 |  |  |  | BTREE |  |  | YES |  |
| home_party_reservations | 1 | fk_home_party_reservations_store | 1 | storeId | A | 0 |  |  |  | BTREE |  |  | YES |  |
| home_party_reservations | 1 | fk_home_party_reservations_set | 1 | baseSetId | A | 0 |  |  | YES | BTREE |  |  | YES |  |

### home_party_set_items
| Table | Non_unique | Key_name | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
|---|---:|---|---:|---|---|---:|---|---|---|---|---|---|---|---|
| home_party_set_items | 0 | PRIMARY | 1 | setItemId | A | 3 |  |  |  | BTREE |  |  | YES |  |
| home_party_set_items | 1 | fk_home_party_set_items_set | 1 | setId | A | 1 |  |  |  | BTREE |  |  | YES |  |
| home_party_set_items | 1 | fk_home_party_set_items_menu | 1 | hpMenuId | A | 3 |  |  |  | BTREE |  |  | YES |  |

### home_party_sets
| Table | Non_unique | Key_name | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
|---|---:|---|---:|---|---|---:|---|---|---|---|---|---|---|---|
| home_party_sets | 0 | PRIMARY | 1 | setId | A | 1 |  |  |  | BTREE |  |  | YES |  |
| home_party_sets | 1 | fk_home_party_sets_store | 1 | storeId | A | 1 |  |  |  | BTREE |  |  | YES |  |

### order_items
| Table | Non_unique | Key_name | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
|---|---:|---|---:|---|---|---:|---|---|---|---|---|---|---|---|
| order_items | 0 | PRIMARY | 1 | orderItemId | A | 0 |  |  |  | BTREE |  |  | YES |  |
| order_items | 1 | idx_order_items_order | 1 | orderId | A | 0 |  |  |  | BTREE |  |  | YES |  |
| order_items | 1 | idx_order_items_menu | 1 | storeMenuId | A | 0 |  |  |  | BTREE |  |  | YES |  |

### orders
| Table | Non_unique | Key_name | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
|---|---:|---|---:|---|---|---:|---|---|---|---|---|---|---|---|
| orders | 0 | PRIMARY | 1 | orderId | A | 0 |  |  |  | BTREE |  |  | YES |  |
| orders | 1 | idx_orders_user | 1 | userId | A | 0 |  |  |  | BTREE |  |  | YES |  |
| orders | 1 | idx_orders_status | 1 | status | A | 0 |  |  |  | BTREE |  |  | YES |  |
| orders | 1 | idx_orders_store | 1 | storeId | A | 0 |  |  |  | BTREE |  |  | YES |  |

### payments
| Table | Non_unique | Key_name | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
|---|---:|---|---:|---|---|---:|---|---|---|---|---|---|---|---|
| payments | 0 | PRIMARY | 1 | paymentId | A | 0 |  |  |  | BTREE |  |  | YES |  |
| payments | 0 | uq_payments_pg_tx | 1 | pgTransactionId | A | 0 |  |  | YES | BTREE |  |  | YES |  |
| payments | 1 | fk_payments_user | 1 | userId | A | 0 |  |  |  | BTREE |  |  | YES |  |
| payments | 1 | idx_payments_order | 1 | orderId | A | 0 |  |  |  | BTREE |  |  | YES |  |
| payments | 1 | idx_payments_order_status | 1 | orderId | A | 0 |  |  |  | BTREE |  |  | YES |  |
| payments | 1 | idx_payments_order_status | 2 | status | A | 0 |  |  |  | BTREE |  |  | YES |  |

### storemenus
| Table | Non_unique | Key_name | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
|---|---:|---|---:|---|---|---:|---|---|---|---|---|---|---|---|
| storemenus | 0 | PRIMARY | 1 | storeMenuId | A | 9 |  |  |  | BTREE |  |  | YES |  |
| storemenus | 1 | fk_storemenus_store | 1 | storeId | A | 2 |  |  |  | BTREE |  |  | YES |  |
| storemenus | 1 | fk_storemenus_category | 1 | categoryId | A | 3 |  |  |  | BTREE |  |  | YES |  |

### stores
| Table | Non_unique | Key_name | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
|---|---:|---|---:|---|---|---:|---|---|---|---|---|---|---|---|
| stores | 0 | PRIMARY | 1 | storeId | A | 2 |  |  |  | BTREE |  |  | YES |  |

### users
| Table | Non_unique | Key_name | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
|---|---:|---|---:|---|---|---:|---|---|---|---|---|---|---|---|
| users | 0 | PRIMARY | 1 | userId | A | 4 |  |  |  | BTREE |  |  | YES |  |

### wishlists
| Table | Non_unique | Key_name | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
|---|---:|---|---:|---|---|---:|---|---|---|---|---|---|---|---|
| wishlists | 0 | PRIMARY | 1 | wishlistId | A | 3 |  |  |  | BTREE |  |  | YES |  |
| wishlists | 0 | uniq_wishlist_user_menu | 1 | userId | A | 1 |  |  |  | BTREE |  |  | YES |  |
| wishlists | 0 | uniq_wishlist_user_menu | 2 | storeMenuId | A | 3 |  |  |  | BTREE |  |  | YES |  |
| wishlists | 1 | fk_wishlists_storemenu | 1 | storeMenuId | A | 3 |  |  |  | BTREE |  |  | YES |  |

## 8. TODO 2 Additional Information Needed

- Decide whether TODO 2 baseline migration should reproduce the current DB exactly, or also fix app/schema mismatches.
- Confirm target environments and whether dev/prod DBs are separate.
- Confirm intended home_party item reference target: home_party_menus.hpMenuId or storemenus.storeMenuId.
- Confirm order amount model: totalAmount only, or totalPrice plus totalAmount.
- Confirm whether users.username should be enforced UNIQUE at DB level.

## 9. TODO 2 Proceedability

- TODO 2 baseline migration design can proceed from this report. Do not automatically apply ALTER/data changes; keep baseline and corrective migrations separate.