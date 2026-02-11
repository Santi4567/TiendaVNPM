-- MySQL dump 10.13  Distrib 8.4.7, for Linux (x86_64)
--
-- Host: localhost    Database: tiendaVN
-- ------------------------------------------------------
-- Server version	8.4.7

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `abonos_libreria`
--

DROP TABLE IF EXISTS `abonos_libreria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `abonos_libreria` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `ID_Venta` int NOT NULL,
  `Fecha` datetime DEFAULT CURRENT_TIMESTAMP,
  `Monto` decimal(10,2) NOT NULL,
  `ID_Usuario` int DEFAULT NULL,
  `Usuario_Snapshot` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`ID`),
  KEY `ID_Venta` (`ID_Venta`),
  CONSTRAINT `abonos_libreria_ibfk_1` FOREIGN KEY (`ID_Venta`) REFERENCES `ventas_libreria` (`ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `abonos_libreria`
--

LOCK TABLES `abonos_libreria` WRITE;
/*!40000 ALTER TABLE `abonos_libreria` DISABLE KEYS */;
INSERT INTO `abonos_libreria` VALUES (1,9,'2026-01-28 13:18:13',10.00,1,'Administrador Principal'),(2,9,'2026-01-28 13:18:53',1001.00,1,'Administrador Principal'),(3,10,'2026-01-28 13:26:42',1000.00,1,'Administrador Principal');
/*!40000 ALTER TABLE `abonos_libreria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `alacena_articulos`
--

DROP TABLE IF EXISTS `alacena_articulos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alacena_articulos` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(200) NOT NULL,
  `Categoria` varchar(100) DEFAULT NULL,
  `Unidad` varchar(50) DEFAULT 'Pieza',
  `Stock` int NOT NULL DEFAULT '0',
  `Fecha_Vencimiento` date DEFAULT NULL,
  `Activo` tinyint DEFAULT '1',
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alacena_articulos`
--

LOCK TABLES `alacena_articulos` WRITE;
/*!40000 ALTER TABLE `alacena_articulos` DISABLE KEYS */;
INSERT INTO `alacena_articulos` VALUES (6,'arroz','Granos','Kg',19,'2026-02-27',1),(7,'aceite','Otros','Pieza',9,NULL,1),(9,'prueba1','Aceites','Litro',19,'2026-02-27',1),(10,'prueba 2','Aceites','Litro',1,'2026-02-21',1);
/*!40000 ALTER TABLE `alacena_articulos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `alacena_movimientos`
--

DROP TABLE IF EXISTS `alacena_movimientos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alacena_movimientos` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `ID_Articulo` int NOT NULL,
  `Tipo` enum('ENTRADA','SALIDA','AJUSTE') NOT NULL,
  `Cantidad` int NOT NULL,
  `Motivo` varchar(255) DEFAULT NULL,
  `ID_Usuario` int DEFAULT NULL,
  `Usuario_Snapshot` varchar(100) DEFAULT NULL,
  `Fecha` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID`),
  KEY `ID_Articulo` (`ID_Articulo`),
  CONSTRAINT `alacena_movimientos_ibfk_1` FOREIGN KEY (`ID_Articulo`) REFERENCES `alacena_articulos` (`ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alacena_movimientos`
--

LOCK TABLES `alacena_movimientos` WRITE;
/*!40000 ALTER TABLE `alacena_movimientos` DISABLE KEYS */;
INSERT INTO `alacena_movimientos` VALUES (6,6,'SALIDA',1,'preuba',1,'Administrador Principal','2026-02-04 15:15:34'),(7,6,'ENTRADA',10,'donacion',1,'Administrador Principal','2026-02-04 15:30:08'),(8,6,'SALIDA',1,'caducidad vencida',1,'Administrador Principal','2026-02-04 15:30:40'),(9,9,'ENTRADA',20,'Inventario Inicial (Creación)',1,'Administrador Principal','2026-02-04 15:36:48'),(10,7,'SALIDA',1,'familia perez',1,'Administrador Principal','2026-02-04 15:40:43'),(11,6,'SALIDA',1,'familia perez',1,'Administrador Principal','2026-02-04 15:40:43'),(12,9,'SALIDA',1,'familia perez',1,'Administrador Principal','2026-02-04 15:40:43'),(13,10,'ENTRADA',1,'Inventario Inicial (Creación)',1,'Administrador Principal','2026-02-05 15:23:32');
/*!40000 ALTER TABLE `alacena_movimientos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clientes`
--

DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes`
--

LOCK TABLES `clientes` WRITE;
/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
INSERT INTO `clientes` VALUES (1,'Hermano Javi'),(2,'Hermano Alberto'),(3,'Hermano Rafa'),(4,'Hermano Lety'),(5,'Hermano Mari Macedo'),(6,'Anita (Dueña)'),(7,'Hermano Emanuel'),(8,'Hermano Javi Marques'),(9,'Marlene : )'),(11,'Hermana Paty'),(12,'Lupita'),(13,'Antozac'),(14,'Alex 1'),(15,'Hermana Anyi');
/*!40000 ALTER TABLE `clientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cuentas`
--

DROP TABLE IF EXISTS `cuentas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cuentas` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `ID_Cliente` int NOT NULL,
  `ID_Producto` int NOT NULL,
  `Precio` decimal(10,4) NOT NULL,
  `Fecha` date NOT NULL DEFAULT (curdate()),
  `Estado` tinyint(1) NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `ID_Cliente` (`ID_Cliente`),
  KEY `ID_Producto` (`ID_Producto`),
  CONSTRAINT `cuentas_ibfk_1` FOREIGN KEY (`ID_Cliente`) REFERENCES `clientes` (`ID`),
  CONSTRAINT `cuentas_ibfk_2` FOREIGN KEY (`ID_Producto`) REFERENCES `productos` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=170 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cuentas`
--

LOCK TABLES `cuentas` WRITE;
/*!40000 ALTER TABLE `cuentas` DISABLE KEYS */;
/*!40000 ALTER TABLE `cuentas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_ventas_libreria`
--

DROP TABLE IF EXISTS `detalle_ventas_libreria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_ventas_libreria` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `ID_Venta` int NOT NULL,
  `ID_Libro` int DEFAULT NULL,
  `Titulo_Snapshot` varchar(255) NOT NULL,
  `Autor_Snapshot` varchar(150) DEFAULT NULL,
  `Precio_Unitario` decimal(10,2) NOT NULL,
  `Descuento_Aplicado` tinyint DEFAULT '0',
  `Precio_Final` decimal(10,2) NOT NULL,
  `Estado` enum('VENDIDO','DEVUELTO') DEFAULT 'VENDIDO',
  PRIMARY KEY (`ID`),
  KEY `ID_Venta` (`ID_Venta`),
  CONSTRAINT `detalle_ventas_libreria_ibfk_1` FOREIGN KEY (`ID_Venta`) REFERENCES `ventas_libreria` (`ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_ventas_libreria`
--

LOCK TABLES `detalle_ventas_libreria` WRITE;
/*!40000 ALTER TABLE `detalle_ventas_libreria` DISABLE KEYS */;
INSERT INTO `detalle_ventas_libreria` VALUES (1,1,8,'prueba1','sdsdsd',1111.00,0,1111.00,'VENDIDO'),(2,2,8,'prueba1','sdsdsd',1111.00,0,1111.00,'VENDIDO'),(3,3,8,'prueba1','sdsdsd',1111.00,0,1111.00,'VENDIDO'),(4,4,8,'prueba1','sdsdsd',1111.00,0,1111.00,'VENDIDO'),(5,5,8,'prueba1','sdsdsd',1111.00,0,1111.00,'VENDIDO'),(6,5,8,'prueba1','sdsdsd',1111.00,0,1111.00,'VENDIDO'),(7,6,8,'prueba1','sdsdsd',1111.00,0,1111.00,'VENDIDO'),(8,6,8,'prueba1','sdsdsd',1111.00,0,1111.00,'VENDIDO'),(9,7,8,'prueba1','sdsdsd',1111.00,0,1111.00,'VENDIDO'),(10,8,8,'prueba1','sdsdsd',1111.00,0,1111.00,'VENDIDO'),(11,9,8,'prueba1','sdsdsd',1111.00,0,1111.00,'VENDIDO'),(12,10,8,'prueba1','sdsdsd',1111.00,0,1111.00,'VENDIDO');
/*!40000 ALTER TABLE `detalle_ventas_libreria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `libros`
--

DROP TABLE IF EXISTS `libros`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `libros` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `Titulo` varchar(255) NOT NULL,
  `Autor` varchar(150) DEFAULT NULL,
  `Editorial` varchar(100) DEFAULT NULL,
  `Precio` decimal(10,2) NOT NULL DEFAULT '0.00',
  `Stock` int NOT NULL DEFAULT '0',
  `Descuento` tinyint DEFAULT '0',
  `Codigo` varchar(50) DEFAULT NULL,
  `Fecha_Registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `Activo` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`ID`),
  UNIQUE KEY `Codigo` (`Codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `libros`
--

LOCK TABLES `libros` WRITE;
/*!40000 ALTER TABLE `libros` DISABLE KEYS */;
INSERT INTO `libros` VALUES (1,'prueba','prueba','preuba',12.00,1,0,'11221212','2026-01-27 19:21:46',0),(2,'holaaa','sdsdsds','sdsdsd',12.00,10,25,'','2026-01-27 19:39:45',0),(8,'prueba1','sdsdsd','sdsdds',1111.00,5,0,'11111111','2026-01-27 20:39:50',1);
/*!40000 ALTER TABLE `libros` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permisos`
--

DROP TABLE IF EXISTS `permisos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permisos` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `Descripcion` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `Nombre` (`Nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permisos`
--

LOCK TABLES `permisos` WRITE;
/*!40000 ALTER TABLE `permisos` DISABLE KEYS */;
INSERT INTO `permisos` VALUES (1,'view.client','Ver lista y buscar clientes'),(2,'add.client','Registrar nuevos clientes'),(3,'update.client','Modificar datos de clientes'),(4,'delete.client','Eliminar clientes'),(5,'view.product','Ver lista y buscar productos'),(6,'add.product','Registrar nuevos productos'),(7,'update.product','Modificar precios y stock'),(8,'delete.product','Eliminar productos del catálogo'),(9,'view.debt','Ver listado de cuentas pendientes'),(10,'add.debt','Fiarse productos a un cliente'),(11,'settle.debt','Saldar deuda (Cobrar y mover a ventas)'),(12,'update.debt','Eliminar productos agregados por error en cuentas'),(13,'create.sale','Registrar nuevas ventas y descontar stock'),(14,'view.report','Ver reportes de ingresos y ventas históricas'),(15,'view.alerts','Ver alertas de stock bajo y caducidad'),(16,'view.cupboard','Manejo del almacen'),(17,'view.book','Manejo de Libreria');
/*!40000 ALTER TABLE `permisos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productos`
--

DROP TABLE IF EXISTS `productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productos` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `Producto` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `Precio_Proveedor` decimal(10,4) DEFAULT NULL,
  `Unidades` int DEFAULT NULL,
  `Precio_Unidad` decimal(10,4) DEFAULT NULL,
  `Precio_Publico` decimal(10,4) NOT NULL,
  `Stock` int DEFAULT '0',
  `Stock_Minimo` int DEFAULT '5',
  `Fecha_Caducidad` date DEFAULT NULL,
  `Fecha_Ultimo_Ingreso` datetime DEFAULT CURRENT_TIMESTAMP,
  `Fecha` date NOT NULL DEFAULT (curdate()),
  `Codigo` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=128 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productos`
--

LOCK TABLES `productos` WRITE;
/*!40000 ALTER TABLE `productos` DISABLE KEYS */;
INSERT INTO `productos` VALUES (1,'Yogurt Alpura Manzana Deslactosado',113.0000,12,9.4166,15.0000,10,5,NULL,'2026-01-09 13:18:26','2025-08-13','7501055914791'),(2,'Rebana de pizza',100.0000,8,12.5000,20.0000,12,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(3,'mini bubulubo',95.0000,25,3.8000,6.0000,10,5,NULL,'2026-01-09 13:18:26','2025-08-15','074323011616'),(4,'Mazapanes',113.0000,40,2.8250,5.0000,10,5,NULL,'2026-01-09 13:18:26','2025-08-15','724869007214'),(5,'Paletas payasos',112.0000,15,8.1330,15.0000,10,5,NULL,'2026-01-09 13:18:26','2025-08-15','074323099416'),(6,'Capuchinos',115.0000,20,5.7500,18.0000,7,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(7,'Tarta Mix',122.0000,28,4.3570,8.0000,10,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(8,'Galletas Salvado',194.0000,30,6.4660,12.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','7501035411432'),(9,'Amarantos',NULL,NULL,NULL,5.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(10,'Arcoiris',NULL,NULL,NULL,12.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','7501000624089'),(11,'Carlos V',NULL,NULL,NULL,10.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(12,'chicles',NULL,NULL,NULL,12.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(13,'Choco Zero Rojo',NULL,NULL,NULL,18.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','7503022109100'),(14,'Cremax',NULL,NULL,NULL,20.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(15,'Dulcesitos',NULL,NULL,NULL,2.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(16,'Duvalin',NULL,NULL,NULL,7.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(17,'Emperador Chicas',NULL,NULL,NULL,12.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','7500478043675'),(18,'Emperador Medianas',NULL,NULL,NULL,17.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(19,'Emperador Grandes',NULL,NULL,NULL,19.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(20,'Galletas de avena',NULL,NULL,NULL,12.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(21,'Mini Gelatinas',NULL,NULL,NULL,4.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','603554035049'),(22,'Halls',NULL,NULL,NULL,12.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','7622210267856'),(23,'Hershey\'s',NULL,NULL,NULL,5.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(24,'Kisses',NULL,NULL,NULL,3.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(25,'Kleenex',NULL,NULL,NULL,10.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','7501017362950'),(26,'Lunetas',NULL,NULL,NULL,5.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(27,'Mazapan de Chocolate',NULL,NULL,NULL,7.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(28,'Mentitas 2pz',NULL,NULL,NULL,1.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(29,'Mentos',NULL,NULL,NULL,12.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(30,'Nutrinut',NULL,NULL,NULL,3.5000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(31,'Palanqueta',NULL,NULL,NULL,15.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(32,'Panditas',NULL,NULL,NULL,15.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(33,'Pelon Grande',NULL,NULL,NULL,18.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(34,'Plativolos',NULL,NULL,NULL,19.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(35,'Paleta Chupa Chups',NULL,NULL,NULL,2.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(36,'Paleta Pelon',NULL,NULL,NULL,5.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(37,'Popotes de tamarindo',NULL,NULL,NULL,4.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(38,'Pollitos de Chocolate',NULL,NULL,NULL,5.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(39,'Pulparido Chico',NULL,NULL,NULL,5.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','725226066660'),(40,'Pulparindo Grande',NULL,NULL,NULL,10.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','725226001913'),(41,'Skittles',NULL,NULL,NULL,10.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','7502226816944'),(42,'Tartaletas',NULL,NULL,NULL,7.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(43,'Winnis Individual',NULL,NULL,NULL,2.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(44,'Winnis Chicos',NULL,NULL,NULL,3.5000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(45,'Winnis 7pzs',NULL,NULL,NULL,5.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','754177505812'),(46,'Paletas Vero',NULL,NULL,NULL,4.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(47,'Chocolates',NULL,NULL,NULL,22.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(48,'Galletas Principe',NULL,NULL,NULL,19.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(49,'Galletas Trikitrakets',NULL,NULL,NULL,19.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(50,'Ricaleta',NULL,NULL,NULL,5.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','659190000019'),(51,'Clorests 2pz',NULL,NULL,NULL,2.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','75019907'),(52,'Cafe de Vaso',NULL,NULL,NULL,18.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(53,'Cafe de taza',NULL,NULL,NULL,12.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(54,'Te',NULL,NULL,NULL,12.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(55,'Agua 600ml',NULL,NULL,NULL,11.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(56,'Agua 1L',NULL,NULL,NULL,13.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','7500525374486'),(57,'Agua 1.5L',NULL,NULL,NULL,17.0000,1,5,'2026-02-26','2026-01-27 12:03:38','2025-08-15','7500533013490'),(58,'Santa Clara Leche Chocolate 180ml',NULL,NULL,NULL,15.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','7501055377183'),(59,'Juguitos',NULL,NULL,NULL,15.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(60,'Cocas Chicas',NULL,NULL,NULL,18.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(61,'Agua Mineral',NULL,NULL,NULL,19.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(62,'Penafiel Adas Naranja 355ml',230.0000,24,9.5800,15.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','7501073841338'),(63,'Jumex',NULL,NULL,NULL,18.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(64,'Cereal Corn Pops',NULL,NULL,NULL,10.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','7501008010006'),(65,'Sabritas',NULL,NULL,NULL,10.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(66,'Tortas',NULL,NULL,NULL,28.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-17',NULL),(67,'Tacos',NULL,NULL,NULL,18.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-17',NULL),(68,'Conchas',NULL,NULL,NULL,15.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-17',NULL),(69,'Avena Sin leche',NULL,NULL,NULL,20.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-17',NULL),(70,'Avena con Leche',NULL,NULL,NULL,25.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-17',NULL),(71,'Mentos menta',NULL,NULL,NULL,1.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-17',NULL),(72,'Boing Mango 250 ml',NULL,NULL,NULL,15.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-17','75001759'),(73,'Gomitas',NULL,NULL,NULL,8.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-17',NULL),(74,'Doritos Chicos',NULL,NULL,NULL,10.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-17','7501011125704'),(75,'Boing Manzana 200ml',NULL,NULL,NULL,15.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','019836710083'),(76,'Cereal Zucaritas Chocolate',NULL,NULL,NULL,10.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7501008066584'),(77,'Cereal ChocoKrispis',NULL,NULL,NULL,10.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7501008019450'),(78,'Cereal Zucaritas',NULL,NULL,NULL,10.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7501008042854'),(79,'Cereal Froot Loops',NULL,NULL,NULL,10.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7501008041291'),(80,'Choco Zero Azul',NULL,NULL,NULL,18.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','052551666396'),(81,'Coca Cola Zero',NULL,NULL,NULL,18.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7501055356256'),(82,'Chokis Chicas',NULL,NULL,NULL,12.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7500478008247'),(83,'Emperador Vainilla Chicas',NULL,NULL,NULL,12.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7500478012404'),(84,'Plati Volos',NULL,NULL,NULL,19.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7503029445294'),(85,'Santa Clara Leche Vainilla180ml',NULL,NULL,NULL,15.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7501055377206'),(86,'Santa Clara Leche Fresa 180ml',NULL,NULL,NULL,15.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7501055377190'),(87,'Rancheritos',NULL,NULL,NULL,10.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7501011125322'),(88,'Churrumais Chicos',NULL,NULL,NULL,10.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7501011132191'),(89,'Chetos Chicos',NULL,NULL,NULL,10.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7501011128323'),(90,'Rufles Queso Chicos',NULL,NULL,NULL,10.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7500478015610'),(91,'Yogurt Fresa Mora Deslactosado',NULL,NULL,NULL,15.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7501055916726'),(92,'Penafiel Lata 355ml',NULL,NULL,NULL,18.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7501073844162'),(93,'Boing Manzana 250 ml',NULL,NULL,NULL,15.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','75001797'),(94,'Oreo Coronado',NULL,NULL,NULL,15.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7622210533159'),(95,'Oreo Original  63g',NULL,NULL,NULL,15.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7622210575401'),(96,'Mini Mamut',NULL,NULL,NULL,5.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7501000630363'),(97,'Paleta Tarrito',NULL,NULL,NULL,4.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7503030374552'),(98,'Paleta Trabalenguas',NULL,NULL,NULL,4.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','759686200098'),(99,'Paletas de Mango',NULL,NULL,NULL,4.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7503030374651'),(100,'Paletas Sandi Brochas',NULL,NULL,NULL,4.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','759686264687'),(101,'Paleta Elote',NULL,NULL,NULL,4.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7503030374613'),(102,'Paleta Chupadedo',NULL,NULL,NULL,4.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','75039127'),(103,'Paleta Cupido',NULL,NULL,NULL,4.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7503030374736'),(104,'Paleta PintaAzul',NULL,NULL,NULL,4.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','759686272682'),(105,'Paleta Manita',NULL,NULL,NULL,4.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7503030374583'),(106,'Santa Clara Leche Capuccino 180ml',NULL,NULL,NULL,15.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7501055377213'),(107,'cerillooooooooos',NULL,NULL,NULL,30000.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7501232002167'),(108,'Boing Mango Lata 340 ml',316.1700,24,13.1700,20.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-31','019836500028'),(109,'Boing Fresa Lata 340 ml',316.1700,24,13.1700,20.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-31','019836500011'),(110,'Boing Manzana Lata 340 ml',316.1700,24,13.1700,20.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-31','019836500301'),(111,'Boing Guayaba Lata 340 ml',316.1700,24,13.1700,20.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-31','019836500035'),(112,'Penafiel Adas Fresada 355ml',NULL,NULL,NULL,15.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-31','7501073841543'),(113,'Penafiel Adas Limonada 355ml',NULL,NULL,NULL,15.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-31','7501073841345'),(114,'Garden Veggie Straws Ranch 28g',NULL,NULL,NULL,20.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-31','829515304935'),(115,'Garden Veggie Straws sal de mar 28g',NULL,NULL,NULL,20.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-31','829515304928'),(116,'Garden Veggie Wavy Chips sal de mar 28g',NULL,NULL,NULL,20.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-31','829515304942'),(117,'Huevo Hervido',NULL,NULL,NULL,7.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-31',NULL),(118,'Kinder Delice Pastelito',195.0000,15,13.0000,20.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-31','8000500267035'),(119,'Licuado Vaso',NULL,NULL,NULL,25.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-31',NULL),(120,'Orden de Huevos',NULL,NULL,NULL,35.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-31',NULL),(121,'Bubbaloo Fresa',NULL,NULL,NULL,2.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-31','75073244'),(122,'MilkyWay',NULL,NULL,NULL,22.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-31','7506174512200'),(123,'m&ms cacahuate 44.3g',NULL,NULL,NULL,22.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-31','7502271911472'),(124,'Tlacoyo 1pz',NULL,NULL,NULL,18.0000,0,5,NULL,'2026-01-09 13:18:26','2025-09-07',NULL),(125,'Canada Dry Lata 237ml',NULL,NULL,NULL,20.0000,0,5,NULL,'2026-01-09 13:18:26','2025-09-07','7501198353594');
/*!40000 ALTER TABLE `productos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `Descripcion` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `Nombre` (`Nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Admin','Acceso total al sistema'),(2,'Vendedor-Tienda','Acceso a tiendita'),(4,'vendedor-Libreria',NULL);
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles_permisos`
--

DROP TABLE IF EXISTS `roles_permisos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles_permisos` (
  `ID_Rol` int NOT NULL,
  `ID_Permiso` int NOT NULL,
  PRIMARY KEY (`ID_Rol`,`ID_Permiso`),
  KEY `ID_Permiso` (`ID_Permiso`),
  CONSTRAINT `fk_permiso` FOREIGN KEY (`ID_Permiso`) REFERENCES `permisos` (`ID`) ON DELETE CASCADE,
  CONSTRAINT `fk_rol` FOREIGN KEY (`ID_Rol`) REFERENCES `roles` (`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles_permisos`
--

LOCK TABLES `roles_permisos` WRITE;
/*!40000 ALTER TABLE `roles_permisos` DISABLE KEYS */;
INSERT INTO `roles_permisos` VALUES (2,1),(2,2),(2,3),(2,4),(2,5),(2,6),(2,7),(2,8),(2,9),(2,10),(2,11),(2,12),(2,13),(2,15),(4,17);
/*!40000 ALTER TABLE `roles_permisos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `Usuario` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `Nombre_Completo` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `Passwd` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `ID_Rol` int NOT NULL,
  `Activo` tinyint(1) DEFAULT '1',
  `Fecha_Creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `Usuario` (`Usuario`),
  KEY `ID_Rol` (`ID_Rol`),
  CONSTRAINT `fk_usuario_rol` FOREIGN KEY (`ID_Rol`) REFERENCES `roles` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','Administrador Principal','$2a$12$WHeIbrwaUYcNG9Q1yU4X9e.ev3URbzcbFoMBnyH9KWd2OUW6WdUna',1,1,'2026-01-09 19:28:40'),(5,'vendedor-tienda','Antozac','$2b$10$amOgFihxNTQz3iqDKBgxpOopriqVtjw5iftpT96biWZaQt0pWOwna',2,1,'2026-01-28 23:07:08'),(6,'Libreria@vn.com','Lupita','$2b$10$cy8BIZhkJ1L7r9177spmFORX9BvEyDebieTWgRsiL10pWLp6tmi0O',4,1,'2026-02-05 22:18:42');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ventas`
--

DROP TABLE IF EXISTS `ventas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ventas` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `ID_Producto` int DEFAULT NULL,
  `Producto_Snapshot` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `Precio` decimal(10,4) NOT NULL,
  `ID_Cliente` int DEFAULT NULL,
  `ID_Usuario` int NOT NULL,
  `Fecha` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Estado` enum('APROBADA','CANCELADA') COLLATE utf8mb4_general_ci DEFAULT 'APROBADA',
  `Cliente_Snapshot` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Usuario_Snapshot` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`ID`),
  KEY `ID_Producto` (`ID_Producto`),
  KEY `ID_Cliente` (`ID_Cliente`),
  KEY `fk_venta_usuario` (`ID_Usuario`),
  CONSTRAINT `fk_venta_producto_setnull` FOREIGN KEY (`ID_Producto`) REFERENCES `productos` (`ID`) ON DELETE SET NULL,
  CONSTRAINT `fk_venta_usuario` FOREIGN KEY (`ID_Usuario`) REFERENCES `users` (`ID`),
  CONSTRAINT `ventas_ibfk_2` FOREIGN KEY (`ID_Cliente`) REFERENCES `clientes` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=286 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ventas`
--

LOCK TABLES `ventas` WRITE;
/*!40000 ALTER TABLE `ventas` DISABLE KEYS */;
INSERT INTO `ventas` VALUES (39,68,'Conchas',15.0000,NULL,1,'2025-08-17 16:43:20','APROBADA',NULL,'admin'),(40,67,'Tacos',22.0000,4,1,'2025-08-17 17:12:23','APROBADA','Hermano Lety','admin'),(41,69,'Avena Sin leche',20.0000,4,1,'2025-08-17 17:12:23','APROBADA','Hermano Lety','admin'),(42,54,'Te',12.0000,4,1,'2025-08-17 17:12:23','APROBADA','Hermano Lety','admin'),(43,20,'Galletas de avena',12.0000,4,1,'2025-08-17 17:12:23','APROBADA','Hermano Lety','admin'),(44,58,'Santa Clara Leche Chocolate 180ml',15.0000,NULL,1,'2025-08-17 17:44:45','APROBADA',NULL,'admin'),(45,66,'Tortas',28.0000,NULL,1,'2025-08-17 17:46:51','APROBADA',NULL,'admin'),(46,66,'Tortas',28.0000,NULL,1,'2025-08-17 17:46:51','APROBADA',NULL,'admin'),(47,53,'Cafe de taza',12.0000,NULL,1,'2025-08-17 17:48:28','APROBADA',NULL,'admin'),(48,68,'Conchas',15.0000,NULL,1,'2025-08-17 17:50:37','APROBADA',NULL,'admin'),(49,74,'Doritos Chicos',10.0000,NULL,1,'2025-08-17 17:50:50','APROBADA',NULL,'admin'),(50,68,'Conchas',15.0000,NULL,1,'2025-08-17 17:53:48','APROBADA',NULL,'admin'),(51,66,'Tortas',28.0000,NULL,1,'2025-08-17 17:54:10','APROBADA',NULL,'admin'),(52,3,'mini bubulubo',6.0000,NULL,1,'2025-08-17 18:02:43','APROBADA',NULL,'admin'),(53,72,'Boing Mango 250 ml',15.0000,NULL,1,'2025-08-17 18:02:43','APROBADA',NULL,'admin'),(54,68,'Conchas',15.0000,NULL,1,'2025-08-17 18:30:08','APROBADA',NULL,'admin'),(55,69,'Avena Sin leche',20.0000,NULL,1,'2025-08-17 18:30:52','APROBADA',NULL,'admin'),(56,66,'Tortas',28.0000,NULL,1,'2025-08-17 18:30:52','APROBADA',NULL,'admin'),(57,68,'Conchas',15.0000,NULL,1,'2025-08-17 18:33:01','APROBADA',NULL,'admin'),(58,52,'Cafe de Vaso',18.0000,NULL,1,'2025-08-17 19:03:23','APROBADA',NULL,'admin'),(59,52,'Cafe de Vaso',18.0000,NULL,1,'2025-08-17 19:03:23','APROBADA',NULL,'admin'),(60,54,'Te',12.0000,NULL,1,'2025-08-17 19:03:57','APROBADA',NULL,'admin'),(61,66,'Tortas',28.0000,NULL,1,'2025-08-17 19:04:39','APROBADA',NULL,'admin'),(62,66,'Tortas',28.0000,NULL,1,'2025-08-17 19:04:39','APROBADA',NULL,'admin'),(63,67,'Tacos',22.0000,NULL,1,'2025-08-17 19:05:11','APROBADA',NULL,'admin'),(64,67,'Tacos',22.0000,NULL,1,'2025-08-17 19:05:11','APROBADA',NULL,'admin'),(65,67,'Tacos',22.0000,NULL,1,'2025-08-17 19:05:11','APROBADA',NULL,'admin'),(66,67,'Tacos',22.0000,NULL,1,'2025-08-17 19:05:11','APROBADA',NULL,'admin'),(67,69,'Avena Sin leche',20.0000,NULL,1,'2025-08-17 19:06:12','APROBADA',NULL,'admin'),(68,59,'Juguitos',15.0000,NULL,1,'2025-08-17 19:07:14','APROBADA',NULL,'admin'),(69,60,'Cocas Chicas',18.0000,NULL,1,'2025-08-17 19:47:46','APROBADA',NULL,'admin'),(70,55,'Agua 600ml',11.0000,NULL,1,'2025-08-17 20:15:49','APROBADA',NULL,'admin'),(71,67,'Tacos',22.0000,3,1,'2025-08-17 20:16:51','APROBADA','Hermano Rafa','admin'),(72,67,'Tacos',22.0000,3,1,'2025-08-17 20:16:51','APROBADA','Hermano Rafa','admin'),(73,60,'Cocas Chicas',18.0000,3,1,'2025-08-17 20:16:51','APROBADA','Hermano Rafa','admin'),(74,60,'Cocas Chicas',18.0000,3,1,'2025-08-17 20:16:51','APROBADA','Hermano Rafa','admin'),(75,68,'Conchas',15.0000,3,1,'2025-08-17 20:16:51','APROBADA','Hermano Rafa','admin'),(76,69,'Avena Sin leche',20.0000,3,1,'2025-08-17 20:16:51','APROBADA','Hermano Rafa','admin'),(77,73,'Gomitas',8.0000,NULL,1,'2025-08-17 20:22:48','APROBADA',NULL,'admin'),(78,51,'Clorests 2pz',2.0000,NULL,1,'2025-08-17 20:29:47','APROBADA',NULL,'admin'),(79,66,'Tortas',28.0000,14,1,'2025-08-17 20:31:51','APROBADA','Alex 1','admin'),(80,68,'Conchas',15.0000,14,1,'2025-08-17 20:31:51','APROBADA','Alex 1','admin'),(81,60,'Cocas Chicas',18.0000,14,1,'2025-08-17 20:31:51','APROBADA','Alex 1','admin'),(82,66,'Tortas',28.0000,4,1,'2025-08-17 20:43:02','APROBADA','Hermano Lety','admin'),(83,66,'Tortas',28.0000,4,1,'2025-08-17 20:43:02','APROBADA','Hermano Lety','admin'),(84,60,'Cocas Chicas',18.0000,4,1,'2025-08-17 20:43:02','APROBADA','Hermano Lety','admin'),(85,28,'Mentitas 2pz',1.0000,2,1,'2025-08-17 20:47:58','APROBADA','Hermano Alberto','admin'),(86,28,'Mentitas 2pz',1.0000,2,1,'2025-08-17 20:47:58','APROBADA','Hermano Alberto','admin'),(87,66,'Tortas',28.0000,2,1,'2025-08-17 20:47:58','APROBADA','Hermano Alberto','admin'),(88,52,'Cafe de Vaso',18.0000,2,1,'2025-08-17 20:47:58','APROBADA','Hermano Alberto','admin'),(89,72,'Boing Mango 250 ml',15.0000,2,1,'2025-08-17 20:47:58','APROBADA','Hermano Alberto','admin'),(90,67,'Tacos',22.0000,11,1,'2025-08-17 20:50:00','APROBADA','Hermana Paty','admin'),(91,67,'Tacos',22.0000,11,1,'2025-08-17 20:50:00','APROBADA','Hermana Paty','admin'),(92,69,'Avena Sin leche',20.0000,5,1,'2025-08-17 20:59:13','APROBADA','Hermano Mari Macedo','admin'),(93,62,'Penafiel Adas Naranja 355ml',15.0000,5,1,'2025-08-17 20:59:13','APROBADA','Hermano Mari Macedo','admin'),(94,56,'Agua 1L',13.0000,NULL,1,'2025-08-17 21:00:49','APROBADA',NULL,'admin'),(95,1,'Yogurt Alpura Manzana Deslactosado',15.0000,6,1,'2025-08-17 21:03:23','APROBADA','Anita (Dueña)','admin'),(96,62,'Penafiel Adas Naranja 355ml',15.0000,6,1,'2025-08-17 21:03:23','APROBADA','Anita (Dueña)','admin'),(97,62,'Penafiel Adas Naranja 355ml',15.0000,6,1,'2025-08-17 21:03:23','APROBADA','Anita (Dueña)','admin'),(98,66,'Tortas',28.0000,6,1,'2025-08-17 21:03:23','APROBADA','Anita (Dueña)','admin'),(99,66,'Tortas',28.0000,6,1,'2025-08-17 21:03:23','APROBADA','Anita (Dueña)','admin'),(100,66,'Tortas',28.0000,6,1,'2025-08-17 21:03:23','APROBADA','Anita (Dueña)','admin'),(101,69,'Avena Sin leche',20.0000,6,1,'2025-08-17 21:03:23','APROBADA','Anita (Dueña)','admin'),(102,67,'Tacos',22.0000,6,1,'2025-08-17 21:03:23','APROBADA','Anita (Dueña)','admin'),(103,72,'Boing Mango 250 ml',15.0000,6,1,'2025-08-17 21:03:23','APROBADA','Anita (Dueña)','admin'),(104,67,'Tacos',22.0000,6,1,'2025-08-17 21:03:23','APROBADA','Anita (Dueña)','admin'),(105,20,'Galletas de avena',12.0000,6,1,'2025-08-17 21:03:23','APROBADA','Anita (Dueña)','admin'),(106,57,'Agua 1.5L',16.0000,6,1,'2025-08-17 21:03:23','APROBADA','Anita (Dueña)','admin'),(107,73,'Gomitas',8.0000,6,1,'2025-08-17 21:03:23','APROBADA','Anita (Dueña)','admin'),(108,55,'Agua 600ml',11.0000,6,1,'2025-08-17 21:03:23','APROBADA','Anita (Dueña)','admin'),(109,7,'Tarta Mix',8.0000,6,1,'2025-08-17 21:03:23','APROBADA','Anita (Dueña)','admin'),(110,62,'Penafiel Adas Naranja 355ml',15.0000,6,1,'2025-08-17 21:03:23','APROBADA','Anita (Dueña)','admin'),(111,4,'Mazapanes',5.0000,6,1,'2025-08-17 21:03:23','APROBADA','Anita (Dueña)','admin'),(112,5,'Paletas payasos',15.0000,NULL,1,'2025-08-24 16:36:07','APROBADA',NULL,'admin'),(113,21,'Mini Gelatinas',4.0000,NULL,1,'2025-08-24 17:00:00','APROBADA',NULL,'admin'),(114,21,'Mini Gelatinas',4.0000,NULL,1,'2025-08-24 17:00:00','APROBADA',NULL,'admin'),(115,86,'Santa Clara Leche Fresa 180ml',15.0000,NULL,1,'2025-08-24 17:48:02','APROBADA',NULL,'admin'),(116,60,'Cocas Chicas',18.0000,NULL,1,'2025-08-24 17:48:02','APROBADA',NULL,'admin'),(117,58,'Santa Clara Leche Chocolate 180ml',15.0000,NULL,1,'2025-08-24 17:48:56','APROBADA',NULL,'admin'),(118,7,'Tarta Mix',8.0000,NULL,1,'2025-08-24 17:48:56','APROBADA',NULL,'admin'),(119,7,'Tarta Mix',8.0000,NULL,1,'2025-08-24 17:49:27','APROBADA',NULL,'admin'),(120,20,'Galletas de avena',12.0000,NULL,1,'2025-08-24 17:49:27','APROBADA',NULL,'admin'),(121,66,'Tortas',28.0000,NULL,1,'2025-08-24 18:04:14','APROBADA',NULL,'admin'),(122,66,'Tortas',28.0000,NULL,1,'2025-08-24 18:04:14','APROBADA',NULL,'admin'),(123,66,'Tortas',28.0000,NULL,1,'2025-08-24 18:14:59','APROBADA',NULL,'admin'),(124,66,'Tortas',28.0000,NULL,1,'2025-08-24 18:14:59','APROBADA',NULL,'admin'),(125,53,'Cafe de taza',12.0000,NULL,1,'2025-08-24 18:14:59','APROBADA',NULL,'admin'),(126,79,'Cereal Froot Loops',10.0000,NULL,1,'2025-08-24 18:14:59','APROBADA',NULL,'admin'),(127,59,'Juguitos',15.0000,NULL,1,'2025-08-24 18:14:59','APROBADA',NULL,'admin'),(128,87,'Rancheritos',10.0000,NULL,1,'2025-08-24 18:15:31','APROBADA',NULL,'admin'),(129,60,'Cocas Chicas',18.0000,2,1,'2025-08-24 18:23:37','APROBADA','Hermano Alberto','admin'),(130,66,'Tortas',28.0000,2,1,'2025-08-24 18:23:37','APROBADA','Hermano Alberto','admin'),(131,60,'Cocas Chicas',18.0000,2,1,'2025-08-24 18:23:37','APROBADA','Hermano Alberto','admin'),(132,67,'Tacos',18.0000,2,1,'2025-08-24 18:23:37','APROBADA','Hermano Alberto','admin'),(133,55,'Agua 600ml',11.0000,NULL,1,'2025-08-24 18:25:14','APROBADA',NULL,'admin'),(134,84,'Plati Volos',19.0000,NULL,1,'2025-08-24 18:26:08','APROBADA',NULL,'admin'),(135,92,'Penafiel Lata 355ml',18.0000,NULL,1,'2025-08-24 19:06:57','APROBADA',NULL,'admin'),(136,66,'Tortas',28.0000,NULL,1,'2025-08-24 19:20:38','APROBADA',NULL,'admin'),(137,68,'Conchas',15.0000,NULL,1,'2025-08-24 19:20:38','APROBADA',NULL,'admin'),(138,51,'Clorests 2pz',2.0000,NULL,1,'2025-08-24 19:30:22','APROBADA',NULL,'admin'),(139,51,'Clorests 2pz',2.0000,NULL,1,'2025-08-24 19:30:22','APROBADA',NULL,'admin'),(140,51,'Clorests 2pz',2.0000,NULL,1,'2025-08-24 19:30:22','APROBADA',NULL,'admin'),(141,51,'Clorests 2pz',2.0000,NULL,1,'2025-08-24 19:30:22','APROBADA',NULL,'admin'),(142,51,'Clorests 2pz',2.0000,NULL,1,'2025-08-24 19:30:22','APROBADA',NULL,'admin'),(143,55,'Agua 600ml',11.0000,NULL,1,'2025-08-24 19:30:22','APROBADA',NULL,'admin'),(144,72,'Boing Mango 250 ml',15.0000,NULL,1,'2025-08-24 19:33:00','APROBADA',NULL,'admin'),(145,15,'Dulcesitos',2.0000,NULL,1,'2025-08-24 19:33:00','APROBADA',NULL,'admin'),(146,15,'Dulcesitos',2.0000,NULL,1,'2025-08-24 19:33:00','APROBADA',NULL,'admin'),(147,15,'Dulcesitos',2.0000,NULL,1,'2025-08-24 19:33:00','APROBADA',NULL,'admin'),(148,62,'Penafiel Adas Naranja 355ml',15.0000,5,1,'2025-08-24 19:39:23','APROBADA','Hermano Mari Macedo','admin'),(149,69,'Avena Sin leche',20.0000,5,1,'2025-08-24 19:39:23','APROBADA','Hermano Mari Macedo','admin'),(150,69,'Avena Sin leche',20.0000,5,1,'2025-08-24 19:39:23','APROBADA','Hermano Mari Macedo','admin'),(151,55,'Agua 600ml',11.0000,9,1,'2025-08-24 19:54:41','APROBADA','Marlene : )','admin'),(152,73,'Gomitas',8.0000,NULL,1,'2025-08-24 20:15:23','APROBADA',NULL,'admin'),(153,17,'Emperador Chicas',12.0000,NULL,1,'2025-08-24 20:15:23','APROBADA',NULL,'admin'),(154,66,'Tortas',28.0000,7,1,'2025-08-24 20:21:03','APROBADA','Hermano Emanuel','admin'),(155,69,'Avena Sin leche',20.0000,NULL,1,'2025-08-24 20:25:51','APROBADA',NULL,'admin'),(156,55,'Agua 600ml',11.0000,NULL,1,'2025-08-31 16:44:26','APROBADA',NULL,'admin'),(157,69,'Avena Sin leche',20.0000,NULL,1,'2025-08-31 16:44:52','APROBADA',NULL,'admin'),(158,73,'Gomitas',8.0000,13,1,'2025-08-31 16:45:55','APROBADA','Antozac','admin'),(159,88,'Churrumais Chicos',10.0000,15,1,'2025-08-31 17:56:01','APROBADA','Hermana Anyi','admin'),(160,111,'Boing Guayaba Lata 340 ml',20.0000,NULL,1,'2025-08-31 17:58:39','APROBADA',NULL,'admin'),(161,108,'Boing Mango Lata 340 ml',20.0000,NULL,1,'2025-08-31 17:58:39','APROBADA',NULL,'admin'),(162,66,'Tortas',28.0000,NULL,1,'2025-08-31 17:58:39','APROBADA',NULL,'admin'),(163,66,'Tortas',28.0000,NULL,1,'2025-08-31 17:58:39','APROBADA',NULL,'admin'),(164,53,'Cafe de taza',12.0000,NULL,1,'2025-08-31 18:00:46','APROBADA',NULL,'admin'),(165,53,'Cafe de taza',12.0000,NULL,1,'2025-08-31 18:00:46','APROBADA',NULL,'admin'),(166,69,'Avena Sin leche',20.0000,NULL,1,'2025-08-31 18:01:17','APROBADA',NULL,'admin'),(167,57,'Agua 1.5L',16.0000,NULL,1,'2025-08-31 18:01:33','APROBADA',NULL,'admin'),(168,66,'Tortas',28.0000,NULL,1,'2025-08-31 18:01:48','APROBADA',NULL,'admin'),(169,60,'Cocas Chicas',18.0000,3,1,'2025-08-31 19:17:04','APROBADA','Hermano Rafa','admin'),(170,60,'Cocas Chicas',18.0000,3,1,'2025-08-31 19:17:04','APROBADA','Hermano Rafa','admin'),(171,92,'Penafiel Lata 355ml',18.0000,3,1,'2025-08-31 19:17:04','APROBADA','Hermano Rafa','admin'),(172,120,'Orden de Huevos',35.0000,3,1,'2025-08-31 19:17:04','APROBADA','Hermano Rafa','admin'),(173,75,'Boing Manzana 200ml',15.0000,3,1,'2025-08-31 19:17:04','APROBADA','Hermano Rafa','admin'),(174,117,'Huevo Hervido',7.0000,3,1,'2025-08-31 19:17:04','APROBADA','Hermano Rafa','admin'),(175,117,'Huevo Hervido',7.0000,3,1,'2025-08-31 19:17:04','APROBADA','Hermano Rafa','admin'),(176,13,'Choco Zero Rojo',18.0000,NULL,1,'2025-08-31 19:18:52','APROBADA',NULL,'admin'),(177,22,'Halls',12.0000,NULL,1,'2025-08-31 19:38:25','APROBADA',NULL,'admin'),(178,73,'Gomitas',8.0000,NULL,1,'2025-08-31 19:38:25','APROBADA',NULL,'admin'),(179,118,'Kinder Delice Pastelito',20.0000,NULL,1,'2025-08-31 20:08:41','APROBADA',NULL,'admin'),(180,66,'Tortas',28.0000,NULL,1,'2025-08-31 20:20:15','APROBADA',NULL,'admin'),(181,66,'Tortas',28.0000,NULL,1,'2025-08-31 20:20:15','APROBADA',NULL,'admin'),(182,69,'Avena Sin leche',20.0000,5,1,'2025-08-31 20:22:57','APROBADA','Hermano Mari Macedo','admin'),(183,35,'Paleta Chupa Chups',2.0000,5,1,'2025-08-31 20:22:57','APROBADA','Hermano Mari Macedo','admin'),(184,109,'Boing Fresa Lata 340 ml',20.0000,NULL,1,'2025-08-31 20:23:29','APROBADA',NULL,'admin'),(185,121,'Bubbaloo Fresa',2.0000,NULL,1,'2025-08-31 20:24:30','APROBADA',NULL,'admin'),(186,121,'Bubbaloo Fresa',2.0000,NULL,1,'2025-08-31 20:24:30','APROBADA',NULL,'admin'),(187,82,'Chokis Chicas',12.0000,NULL,1,'2025-08-31 20:25:14','APROBADA',NULL,'admin'),(188,10,'Arcoiris',12.0000,NULL,1,'2025-08-31 20:25:14','APROBADA',NULL,'admin'),(189,68,'Conchas',15.0000,2,1,'2025-08-31 20:28:05','APROBADA','Hermano Alberto','admin'),(190,68,'Conchas',15.0000,2,1,'2025-08-31 20:28:05','APROBADA','Hermano Alberto','admin'),(191,109,'Boing Fresa Lata 340 ml',20.0000,2,1,'2025-08-31 20:28:05','APROBADA','Hermano Alberto','admin'),(192,110,'Boing Manzana Lata 340 ml',20.0000,2,1,'2025-08-31 20:28:05','APROBADA','Hermano Alberto','admin'),(193,66,'Tortas',28.0000,2,1,'2025-08-31 20:28:05','APROBADA','Hermano Alberto','admin'),(194,66,'Tortas',28.0000,2,1,'2025-08-31 20:28:05','APROBADA','Hermano Alberto','admin'),(195,62,'Penafiel Adas Naranja 355ml',15.0000,2,1,'2025-08-31 20:28:05','APROBADA','Hermano Alberto','admin'),(196,73,'Gomitas',8.0000,NULL,1,'2025-08-31 20:28:20','APROBADA',NULL,'admin'),(197,90,'Rufles Queso Chicos',10.0000,NULL,1,'2025-08-31 20:28:20','APROBADA',NULL,'admin'),(198,80,'Choco Zero Azul',18.0000,NULL,1,'2025-08-31 20:41:29','APROBADA',NULL,'admin'),(199,80,'Choco Zero Azul',18.0000,NULL,1,'2025-08-31 20:41:29','APROBADA',NULL,'admin'),(200,51,'Clorests 2pz',2.0000,NULL,1,'2025-08-31 20:41:29','APROBADA',NULL,'admin'),(201,51,'Clorests 2pz',2.0000,NULL,1,'2025-08-31 20:41:29','APROBADA',NULL,'admin'),(202,51,'Clorests 2pz',2.0000,NULL,1,'2025-08-31 20:41:29','APROBADA',NULL,'admin'),(203,51,'Clorests 2pz',2.0000,NULL,1,'2025-08-31 20:41:29','APROBADA',NULL,'admin'),(204,51,'Clorests 2pz',2.0000,NULL,1,'2025-08-31 20:41:29','APROBADA',NULL,'admin'),(205,118,'Kinder Delice Pastelito',20.0000,9,1,'2025-08-31 20:41:41','APROBADA','Marlene : )','admin'),(206,108,'Boing Mango Lata 340 ml',20.0000,9,1,'2025-08-31 20:41:41','APROBADA','Marlene : )','admin'),(207,69,'Avena Sin leche',20.0000,4,1,'2025-08-31 20:56:26','APROBADA','Hermano Lety','admin'),(208,71,'Mentos menta',1.0000,4,1,'2025-08-31 20:56:26','APROBADA','Hermano Lety','admin'),(209,71,'Mentos menta',1.0000,4,1,'2025-08-31 20:56:26','APROBADA','Hermano Lety','admin'),(210,66,'Tortas',28.0000,4,1,'2025-08-31 20:56:26','APROBADA','Hermano Lety','admin'),(211,60,'Cocas Chicas',18.0000,4,1,'2025-08-31 20:56:26','APROBADA','Hermano Lety','admin'),(212,69,'Avena Sin leche',20.0000,6,1,'2025-08-31 16:39:54','APROBADA','Anita (Dueña)','admin'),(213,69,'Avena Sin leche',20.0000,6,1,'2025-08-31 16:39:54','APROBADA','Anita (Dueña)','admin'),(214,57,'Agua 1.5L',16.0000,6,1,'2025-08-31 16:39:54','APROBADA','Anita (Dueña)','admin'),(215,68,'Conchas',15.0000,6,1,'2025-08-31 16:39:54','APROBADA','Anita (Dueña)','admin'),(216,68,'Conchas',15.0000,NULL,1,'2025-09-07 17:02:06','APROBADA',NULL,'admin'),(217,68,'Conchas',15.0000,NULL,1,'2025-09-07 17:02:06','APROBADA',NULL,'admin'),(218,60,'Cocas Chicas',18.0000,NULL,1,'2025-09-07 17:02:06','APROBADA',NULL,'admin'),(219,60,'Cocas Chicas',18.0000,NULL,1,'2025-09-07 17:02:06','APROBADA',NULL,'admin'),(220,75,'Boing Manzana 200ml',15.0000,NULL,1,'2025-09-07 18:05:03','APROBADA',NULL,'admin'),(221,28,'Mentitas 2pz',1.0000,NULL,1,'2025-09-07 18:05:45','APROBADA',NULL,'admin'),(222,66,'Tortas',28.0000,NULL,1,'2025-09-07 18:06:41','APROBADA',NULL,'admin'),(223,89,'Chetos Chicos',10.0000,NULL,1,'2025-09-07 18:08:56','APROBADA',NULL,'admin'),(224,89,'Chetos Chicos',10.0000,NULL,1,'2025-09-07 18:08:56','APROBADA',NULL,'admin'),(225,56,'Agua 1L',13.0000,NULL,1,'2025-09-07 18:08:56','APROBADA',NULL,'admin'),(226,53,'Cafe de taza',12.0000,NULL,1,'2025-09-07 18:08:56','APROBADA',NULL,'admin'),(227,66,'Tortas',28.0000,NULL,1,'2025-09-07 18:09:30','APROBADA',NULL,'admin'),(228,69,'Avena Sin leche',20.0000,NULL,1,'2025-09-07 18:09:39','APROBADA',NULL,'admin'),(229,66,'Tortas',28.0000,NULL,1,'2025-09-07 18:10:18','APROBADA',NULL,'admin'),(230,69,'Avena Sin leche',20.0000,NULL,1,'2025-09-07 18:10:18','APROBADA',NULL,'admin'),(231,52,'Cafe de Vaso',18.0000,NULL,1,'2025-09-07 18:10:18','APROBADA',NULL,'admin'),(232,66,'Tortas',28.0000,NULL,1,'2025-09-07 18:11:46','APROBADA',NULL,'admin'),(233,66,'Tortas',28.0000,NULL,1,'2025-09-07 18:11:46','APROBADA',NULL,'admin'),(234,66,'Tortas',28.0000,NULL,1,'2025-09-07 19:04:00','APROBADA',NULL,'admin'),(235,96,'Mini Mamut',5.0000,NULL,1,'2025-09-07 19:42:37','APROBADA',NULL,'admin'),(236,96,'Mini Mamut',5.0000,NULL,1,'2025-09-07 19:42:37','APROBADA',NULL,'admin'),(237,125,'Canada Dry Lata 237ml',20.0000,6,1,'2025-09-07 20:04:21','APROBADA','Anita (Dueña)','admin'),(238,109,'Boing Fresa Lata 340 ml',20.0000,6,1,'2025-09-07 20:04:21','APROBADA','Anita (Dueña)','admin'),(239,124,'Tlacoyo 1pz',20.0000,6,1,'2025-09-07 20:04:21','APROBADA','Anita (Dueña)','admin'),(240,124,'Tlacoyo 1pz',20.0000,6,1,'2025-09-07 20:04:21','APROBADA','Anita (Dueña)','admin'),(241,124,'Tlacoyo 1pz',20.0000,6,1,'2025-09-07 20:04:21','APROBADA','Anita (Dueña)','admin'),(242,124,'Tlacoyo 1pz',20.0000,6,1,'2025-09-07 20:04:21','APROBADA','Anita (Dueña)','admin'),(243,57,'Agua 1.5L',16.0000,6,1,'2025-09-07 20:04:21','APROBADA','Anita (Dueña)','admin'),(244,70,'Avena con Leche',25.0000,6,1,'2025-09-07 20:04:21','APROBADA','Anita (Dueña)','admin'),(245,70,'Avena con Leche',25.0000,6,1,'2025-09-07 20:04:21','APROBADA','Anita (Dueña)','admin'),(246,69,'Avena Sin leche',20.0000,6,1,'2025-09-07 20:04:21','APROBADA','Anita (Dueña)','admin'),(247,120,'Orden de Huevos',35.0000,6,1,'2025-09-07 20:04:21','APROBADA','Anita (Dueña)','admin'),(248,109,'Boing Fresa Lata 340 ml',20.0000,6,1,'2025-09-07 20:04:21','APROBADA','Anita (Dueña)','admin'),(249,113,'Penafiel Adas Limonada 355ml',15.0000,6,1,'2025-09-07 20:04:21','APROBADA','Anita (Dueña)','admin'),(250,66,'Tortas',28.0000,6,1,'2025-09-07 20:04:21','APROBADA','Anita (Dueña)','admin'),(251,66,'Tortas',28.0000,6,1,'2025-09-07 20:04:21','APROBADA','Anita (Dueña)','admin'),(252,5,'Paletas payasos',15.0000,9,1,'2025-09-07 20:10:26','APROBADA','Marlene : )','admin'),(253,5,'Paletas payasos',15.0000,9,1,'2025-09-07 20:10:26','APROBADA','Marlene : )','admin'),(254,5,'Paletas payasos',15.0000,9,1,'2025-09-07 20:10:26','APROBADA','Marlene : )','admin'),(255,45,'Winnis 7pzs',5.0000,9,1,'2025-09-07 20:10:26','APROBADA','Marlene : )','admin'),(256,125,'Canada Dry Lata 237ml',20.0000,9,1,'2025-09-07 20:10:26','APROBADA','Marlene : )','admin'),(257,108,'Boing Mango Lata 340 ml',20.0000,9,1,'2025-09-07 20:10:26','APROBADA','Marlene : )','admin'),(258,66,'Tortas',28.0000,3,1,'2025-09-07 20:29:03','APROBADA','Hermano Rafa','admin'),(259,60,'Cocas Chicas',18.0000,3,1,'2025-09-07 20:29:03','APROBADA','Hermano Rafa','admin'),(260,53,'Cafe de taza',12.0000,3,1,'2025-09-07 20:29:03','APROBADA','Hermano Rafa','admin'),(261,55,'Agua 600ml',11.0000,3,1,'2025-09-07 20:29:03','APROBADA','Hermano Rafa','admin'),(262,60,'Cocas Chicas',18.0000,3,1,'2025-09-07 20:29:03','APROBADA','Hermano Rafa','admin'),(263,55,'Agua 600ml',11.0000,3,1,'2025-09-07 20:29:03','APROBADA','Hermano Rafa','admin'),(264,55,'Agua 600ml',11.0000,3,1,'2025-09-07 20:29:03','APROBADA','Hermano Rafa','admin'),(265,124,'Tlacoyo 1pz',18.0000,3,1,'2025-09-07 20:29:03','APROBADA','Hermano Rafa','admin'),(266,68,'Conchas',15.0000,NULL,1,'2025-09-07 20:37:48','APROBADA',NULL,'admin'),(267,68,'Conchas',15.0000,NULL,1,'2025-09-07 20:37:48','APROBADA',NULL,'admin'),(268,66,'Tortas',28.0000,2,1,'2025-09-07 20:41:37','APROBADA','Hermano Alberto','admin'),(269,62,'Penafiel Adas Naranja 355ml',15.0000,2,1,'2025-09-07 20:41:37','APROBADA','Hermano Alberto','admin'),(270,57,'Agua 1.5L',17.0000,NULL,1,'2026-01-10 21:37:04','APROBADA',NULL,'admin'),(271,57,'Agua 1.5L',17.0000,NULL,1,'2026-01-10 21:37:04','APROBADA',NULL,'admin'),(272,57,'Agua 1.5L',17.0000,NULL,1,'2026-02-04 19:34:28','APROBADA',NULL,'admin'),(273,57,'Agua 1.5L',17.0000,NULL,1,'2026-02-04 19:34:28','APROBADA',NULL,'admin'),(274,57,'Agua 1.5L',17.0000,NULL,1,'2026-02-04 19:34:28','APROBADA',NULL,'admin'),(275,57,'Agua 1.5L',17.0000,NULL,1,'2026-02-04 19:34:28','APROBADA',NULL,'admin'),(276,57,'Agua 1.5L',17.0000,NULL,1,'2026-02-04 19:34:28','APROBADA',NULL,'admin'),(277,57,'Agua 1.5L',17.0000,NULL,1,'2026-02-04 19:34:28','APROBADA',NULL,'admin'),(278,57,'Agua 1.5L',17.0000,NULL,1,'2026-02-04 19:34:28','APROBADA',NULL,'admin'),(279,6,'Capuchinos',18.0000,NULL,1,'2026-02-04 19:38:11','CANCELADA',NULL,'admin'),(280,6,'Capuchinos',18.0000,NULL,1,'2026-02-04 19:38:11','CANCELADA',NULL,'admin'),(281,6,'Capuchinos',18.0000,NULL,1,'2026-02-04 19:38:11','APROBADA',NULL,'admin'),(282,6,'Capuchinos',18.0000,NULL,1,'2026-02-04 19:38:11','APROBADA',NULL,'admin'),(283,6,'Capuchinos',18.0000,NULL,1,'2026-02-04 19:38:11','APROBADA',NULL,'admin'),(284,57,'Agua 1.5L',17.0000,NULL,1,'2026-02-04 22:14:07','APROBADA','Público General','admin'),(285,57,'Agua 1.5L',17.0000,6,1,'2026-02-04 22:15:07','APROBADA','Anita (Dueña)','admin');
/*!40000 ALTER TABLE `ventas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ventas_libreria`
--

DROP TABLE IF EXISTS `ventas_libreria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ventas_libreria` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `Fecha` datetime DEFAULT CURRENT_TIMESTAMP,
  `ID_Usuario` int DEFAULT NULL,
  `Usuario_Snapshot` varchar(100) NOT NULL,
  `ID_Cliente` int DEFAULT NULL,
  `Cliente_Snapshot` varchar(150) DEFAULT NULL,
  `Total_Venta` decimal(10,2) NOT NULL,
  `Monto_Pagado` decimal(10,2) NOT NULL DEFAULT '0.00',
  `Estado` enum('PAGADO','PENDIENTE','CANCELADO') DEFAULT 'PAGADO',
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ventas_libreria`
--

LOCK TABLES `ventas_libreria` WRITE;
/*!40000 ALTER TABLE `ventas_libreria` DISABLE KEYS */;
INSERT INTO `ventas_libreria` VALUES (1,'2026-01-27 14:40:57',1,'Administrador Principal',11,'Hermana Paty',1111.00,1111.00,'PAGADO'),(2,'2026-01-27 15:04:42',1,'Administrador Principal',14,'Alex 1',1111.00,1111.00,'PAGADO'),(3,'2026-01-27 15:05:44',1,'Administrador Principal',3,'Hermano Rafa',1111.00,1111.00,'PAGADO'),(4,'2026-01-27 15:06:45',1,'Administrador Principal',3,'Hermano Rafa',1111.00,111.00,'PAGADO'),(5,'2026-01-27 15:43:29',1,'Administrador Principal',NULL,'Público General',2222.00,2222.00,'PAGADO'),(6,'2026-01-27 15:43:59',1,'Administrador Principal',2,'Hermano Alberto',2222.00,1000.00,'PAGADO'),(7,'2026-01-28 13:06:10',1,'Administrador Principal',3,'Hermano Rafa',1111.00,100.00,'PAGADO'),(8,'2026-01-28 13:11:25',1,'Administrador Principal',3,'Hermano Rafa',1111.00,100.00,'PAGADO'),(9,'2026-01-28 13:17:28',1,'Administrador Principal',3,'Hermano Rafa',1111.00,1111.00,'CANCELADO'),(10,'2026-01-28 13:26:31',1,'Administrador Principal',3,'Hermano Rafa',1111.00,1100.00,'PENDIENTE');
/*!40000 ALTER TABLE `ventas_libreria` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-09 11:55:13
