-- MySQL dump 10.13  Distrib 8.4.6, for Linux (x86_64)
--
-- Host: localhost    Database: tiendaVN
-- ------------------------------------------------------
-- Server version	8.4.6

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
-- Table structure for table `clientes`
--

DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
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
INSERT INTO `cuentas` VALUES (168,14,10,12.0000,'2026-01-10',0);
/*!40000 ALTER TABLE `cuentas` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permisos`
--

LOCK TABLES `permisos` WRITE;
/*!40000 ALTER TABLE `permisos` DISABLE KEYS */;
INSERT INTO `permisos` VALUES (1,'view.client','Ver lista y buscar clientes'),(2,'add.client','Registrar nuevos clientes'),(3,'update.client','Modificar datos de clientes'),(4,'delete.client','Eliminar clientes'),(5,'view.product','Ver lista y buscar productos'),(6,'add.product','Registrar nuevos productos'),(7,'update.product','Modificar precios y stock'),(8,'delete.product','Eliminar productos del catálogo'),(9,'view.debt','Ver listado de cuentas pendientes'),(10,'add.debt','Fiarse productos a un cliente'),(11,'settle.debt','Saldar deuda (Cobrar y mover a ventas)'),(12,'update.debt','Eliminar productos agregados por error en cuentas'),(13,'create.sale','Registrar nuevas ventas y descontar stock'),(14,'view.report','Ver reportes de ingresos y ventas históricas'),(15,'view.alerts','Ver alertas de stock bajo y caducidad');
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
) ENGINE=InnoDB AUTO_INCREMENT=127 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productos`
--

LOCK TABLES `productos` WRITE;
/*!40000 ALTER TABLE `productos` DISABLE KEYS */;
INSERT INTO `productos` VALUES (1,'Yogurt Alpura Manzana Deslactosado',113.0000,12,9.4166,15.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-13','7501055914791'),(2,'Rebana de pizza',100.0000,8,12.5000,20.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(3,'mini bubulubo',95.0000,25,3.8000,6.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','074323011616'),(4,'Mazapanes',113.0000,40,2.8250,5.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','724869007214'),(5,'Paletas payasos',112.0000,15,8.1330,15.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','074323099416'),(6,'Capuchinos',115.0000,20,5.7500,18.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(7,'Tarta Mix',122.0000,28,4.3570,8.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(8,'Galletas Salvado',194.0000,30,6.4660,12.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','7501035411432'),(9,'Amarantos',NULL,NULL,NULL,5.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(10,'Arcoiris',NULL,NULL,NULL,12.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','7501000624089'),(11,'Carlos V',NULL,NULL,NULL,10.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(12,'chicles',NULL,NULL,NULL,12.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(13,'Choco Zero Rojo',NULL,NULL,NULL,18.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','7503022109100'),(14,'Cremax',NULL,NULL,NULL,20.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(15,'Dulcesitos',NULL,NULL,NULL,2.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(16,'Duvalin',NULL,NULL,NULL,7.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(17,'Emperador Chicas',NULL,NULL,NULL,12.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','7500478043675'),(18,'Emperador Medianas',NULL,NULL,NULL,17.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(19,'Emperador Grandes',NULL,NULL,NULL,19.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(20,'Galletas de avena',NULL,NULL,NULL,12.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(21,'Mini Gelatinas',NULL,NULL,NULL,4.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','603554035049'),(22,'Halls',NULL,NULL,NULL,12.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','7622210267856'),(23,'Hershey\'s',NULL,NULL,NULL,5.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(24,'Kisses',NULL,NULL,NULL,3.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(25,'Kleenex',NULL,NULL,NULL,10.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','7501017362950'),(26,'Lunetas',NULL,NULL,NULL,5.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(27,'Mazapan de Chocolate',NULL,NULL,NULL,7.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(28,'Mentitas 2pz',NULL,NULL,NULL,1.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(29,'Mentos',NULL,NULL,NULL,12.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(30,'Nutrinut',NULL,NULL,NULL,3.5000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(31,'Palanqueta',NULL,NULL,NULL,15.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(32,'Panditas',NULL,NULL,NULL,15.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(33,'Pelon Grande',NULL,NULL,NULL,18.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(34,'Plativolos',NULL,NULL,NULL,19.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(35,'Paleta Chupa Chups',NULL,NULL,NULL,2.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(36,'Paleta Pelon',NULL,NULL,NULL,5.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(37,'Popotes de tamarindo',NULL,NULL,NULL,4.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(38,'Pollitos de Chocolate',NULL,NULL,NULL,5.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(39,'Pulparido Chico',NULL,NULL,NULL,5.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','725226066660'),(40,'Pulparindo Grande',NULL,NULL,NULL,10.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','725226001913'),(41,'Skittles',NULL,NULL,NULL,10.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','7502226816944'),(42,'Tartaletas',NULL,NULL,NULL,7.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(43,'Winnis Individual',NULL,NULL,NULL,2.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(44,'Winnis Chicos',NULL,NULL,NULL,3.5000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(45,'Winnis 7pzs',NULL,NULL,NULL,5.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','754177505812'),(46,'Paletas Vero',NULL,NULL,NULL,4.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(47,'Chocolates',NULL,NULL,NULL,22.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(48,'Galletas Principe',NULL,NULL,NULL,19.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(49,'Galletas Trikitrakets',NULL,NULL,NULL,19.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(50,'Ricaleta',NULL,NULL,NULL,5.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','659190000019'),(51,'Clorests 2pz',NULL,NULL,NULL,2.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','75019907'),(52,'Cafe de Vaso',NULL,NULL,NULL,18.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(53,'Cafe de taza',NULL,NULL,NULL,12.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(54,'Te',NULL,NULL,NULL,12.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(55,'Agua 600ml',NULL,NULL,NULL,11.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(56,'Agua 1L',NULL,NULL,NULL,13.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','7500525374486'),(57,'Agua 1.5L',NULL,NULL,NULL,17.0000,8,5,'2026-01-05','2026-01-10 15:08:50','2025-08-15','7500533013490'),(58,'Santa Clara Leche Chocolate 180ml',NULL,NULL,NULL,15.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','7501055377183'),(59,'Juguitos',NULL,NULL,NULL,15.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(60,'Cocas Chicas',NULL,NULL,NULL,18.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(61,'Agua Mineral',NULL,NULL,NULL,19.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(62,'Penafiel Adas Naranja 355ml',230.0000,24,9.5800,15.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','7501073841338'),(63,'Jumex',NULL,NULL,NULL,18.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(64,'Cereal Corn Pops',NULL,NULL,NULL,10.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15','7501008010006'),(65,'Sabritas',NULL,NULL,NULL,10.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-15',NULL),(66,'Tortas',NULL,NULL,NULL,28.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-17',NULL),(67,'Tacos',NULL,NULL,NULL,18.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-17',NULL),(68,'Conchas',NULL,NULL,NULL,15.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-17',NULL),(69,'Avena Sin leche',NULL,NULL,NULL,20.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-17',NULL),(70,'Avena con Leche',NULL,NULL,NULL,25.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-17',NULL),(71,'Mentos menta',NULL,NULL,NULL,1.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-17',NULL),(72,'Boing Mango 250 ml',NULL,NULL,NULL,15.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-17','75001759'),(73,'Gomitas',NULL,NULL,NULL,8.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-17',NULL),(74,'Doritos Chicos',NULL,NULL,NULL,10.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-17','7501011125704'),(75,'Boing Manzana 200ml',NULL,NULL,NULL,15.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','019836710083'),(76,'Cereal Zucaritas Chocolate',NULL,NULL,NULL,10.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7501008066584'),(77,'Cereal ChocoKrispis',NULL,NULL,NULL,10.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7501008019450'),(78,'Cereal Zucaritas',NULL,NULL,NULL,10.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7501008042854'),(79,'Cereal Froot Loops',NULL,NULL,NULL,10.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7501008041291'),(80,'Choco Zero Azul',NULL,NULL,NULL,18.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','052551666396'),(81,'Coca Cola Zero',NULL,NULL,NULL,18.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7501055356256'),(82,'Chokis Chicas',NULL,NULL,NULL,12.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7500478008247'),(83,'Emperador Vainilla Chicas',NULL,NULL,NULL,12.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7500478012404'),(84,'Plati Volos',NULL,NULL,NULL,19.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7503029445294'),(85,'Santa Clara Leche Vainilla180ml',NULL,NULL,NULL,15.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7501055377206'),(86,'Santa Clara Leche Fresa 180ml',NULL,NULL,NULL,15.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7501055377190'),(87,'Rancheritos',NULL,NULL,NULL,10.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7501011125322'),(88,'Churrumais Chicos',NULL,NULL,NULL,10.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7501011132191'),(89,'Chetos Chicos',NULL,NULL,NULL,10.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7501011128323'),(90,'Rufles Queso Chicos',NULL,NULL,NULL,10.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7500478015610'),(91,'Yogurt Fresa Mora Deslactosado',NULL,NULL,NULL,15.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7501055916726'),(92,'Penafiel Lata 355ml',NULL,NULL,NULL,18.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7501073844162'),(93,'Boing Manzana 250 ml',NULL,NULL,NULL,15.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','75001797'),(94,'Oreo Coronado',NULL,NULL,NULL,15.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7622210533159'),(95,'Oreo Original  63g',NULL,NULL,NULL,15.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7622210575401'),(96,'Mini Mamut',NULL,NULL,NULL,5.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7501000630363'),(97,'Paleta Tarrito',NULL,NULL,NULL,4.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7503030374552'),(98,'Paleta Trabalenguas',NULL,NULL,NULL,4.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','759686200098'),(99,'Paletas de Mango',NULL,NULL,NULL,4.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7503030374651'),(100,'Paletas Sandi Brochas',NULL,NULL,NULL,4.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','759686264687'),(101,'Paleta Elote',NULL,NULL,NULL,4.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7503030374613'),(102,'Paleta Chupadedo',NULL,NULL,NULL,4.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','75039127'),(103,'Paleta Cupido',NULL,NULL,NULL,4.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7503030374736'),(104,'Paleta PintaAzul',NULL,NULL,NULL,4.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','759686272682'),(105,'Paleta Manita',NULL,NULL,NULL,4.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7503030374583'),(106,'Santa Clara Leche Capuccino 180ml',NULL,NULL,NULL,15.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7501055377213'),(107,'cerillooooooooos',NULL,NULL,NULL,30000.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-24','7501232002167'),(108,'Boing Mango Lata 340 ml',316.1700,24,13.1700,20.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-31','019836500028'),(109,'Boing Fresa Lata 340 ml',316.1700,24,13.1700,20.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-31','019836500011'),(110,'Boing Manzana Lata 340 ml',316.1700,24,13.1700,20.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-31','019836500301'),(111,'Boing Guayaba Lata 340 ml',316.1700,24,13.1700,20.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-31','019836500035'),(112,'Penafiel Adas Fresada 355ml',NULL,NULL,NULL,15.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-31','7501073841543'),(113,'Penafiel Adas Limonada 355ml',NULL,NULL,NULL,15.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-31','7501073841345'),(114,'Garden Veggie Straws Ranch 28g',NULL,NULL,NULL,20.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-31','829515304935'),(115,'Garden Veggie Straws sal de mar 28g',NULL,NULL,NULL,20.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-31','829515304928'),(116,'Garden Veggie Wavy Chips sal de mar 28g',NULL,NULL,NULL,20.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-31','829515304942'),(117,'Huevo Hervido',NULL,NULL,NULL,7.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-31',NULL),(118,'Kinder Delice Pastelito',195.0000,15,13.0000,20.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-31','8000500267035'),(119,'Licuado Vaso',NULL,NULL,NULL,25.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-31',NULL),(120,'Orden de Huevos',NULL,NULL,NULL,35.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-31',NULL),(121,'Bubbaloo Fresa',NULL,NULL,NULL,2.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-31','75073244'),(122,'MilkyWay',NULL,NULL,NULL,22.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-31','7506174512200'),(123,'m&ms cacahuate 44.3g',NULL,NULL,NULL,22.0000,0,5,NULL,'2026-01-09 13:18:26','2025-08-31','7502271911472'),(124,'Tlacoyo 1pz',NULL,NULL,NULL,18.0000,0,5,NULL,'2026-01-09 13:18:26','2025-09-07',NULL),(125,'Canada Dry Lata 237ml',NULL,NULL,NULL,20.0000,0,5,NULL,'2026-01-09 13:18:26','2025-09-07','7501198353594');
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Admin','Acceso total al sistema'),(2,'Vendedor-Tienda','Acceso a tiendita');
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','Administrador Principal','$2a$12$WHeIbrwaUYcNG9Q1yU4X9e.ev3URbzcbFoMBnyH9KWd2OUW6WdUna',1,1,'2026-01-09 19:28:40'),(2,'nuevoUser','Maria Gonzalez','$2b$10$KAaFXaqV70Tvh/V/mBY1puYJwSQSkx/tvz/ObpD818qIOfRe9AoRu',2,1,'2026-01-09 21:20:23');
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
  PRIMARY KEY (`ID`),
  KEY `ID_Producto` (`ID_Producto`),
  KEY `ID_Cliente` (`ID_Cliente`),
  KEY `fk_venta_usuario` (`ID_Usuario`),
  CONSTRAINT `fk_venta_producto_setnull` FOREIGN KEY (`ID_Producto`) REFERENCES `productos` (`ID`) ON DELETE SET NULL,
  CONSTRAINT `fk_venta_usuario` FOREIGN KEY (`ID_Usuario`) REFERENCES `users` (`ID`),
  CONSTRAINT `ventas_ibfk_2` FOREIGN KEY (`ID_Cliente`) REFERENCES `clientes` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=272 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ventas`
--

LOCK TABLES `ventas` WRITE;
/*!40000 ALTER TABLE `ventas` DISABLE KEYS */;
INSERT INTO `ventas` VALUES (39,68,'Conchas',15.0000,NULL,1,'2025-08-17 16:43:20'),(40,67,'Tacos',22.0000,4,1,'2025-08-17 17:12:23'),(41,69,'Avena Sin leche',20.0000,4,1,'2025-08-17 17:12:23'),(42,54,'Te',12.0000,4,1,'2025-08-17 17:12:23'),(43,20,'Galletas de avena',12.0000,4,1,'2025-08-17 17:12:23'),(44,58,'Santa Clara Leche Chocolate 180ml',15.0000,NULL,1,'2025-08-17 17:44:45'),(45,66,'Tortas',28.0000,NULL,1,'2025-08-17 17:46:51'),(46,66,'Tortas',28.0000,NULL,1,'2025-08-17 17:46:51'),(47,53,'Cafe de taza',12.0000,NULL,1,'2025-08-17 17:48:28'),(48,68,'Conchas',15.0000,NULL,1,'2025-08-17 17:50:37'),(49,74,'Doritos Chicos',10.0000,NULL,1,'2025-08-17 17:50:50'),(50,68,'Conchas',15.0000,NULL,1,'2025-08-17 17:53:48'),(51,66,'Tortas',28.0000,NULL,1,'2025-08-17 17:54:10'),(52,3,'mini bubulubo',6.0000,NULL,1,'2025-08-17 18:02:43'),(53,72,'Boing Mango 250 ml',15.0000,NULL,1,'2025-08-17 18:02:43'),(54,68,'Conchas',15.0000,NULL,1,'2025-08-17 18:30:08'),(55,69,'Avena Sin leche',20.0000,NULL,1,'2025-08-17 18:30:52'),(56,66,'Tortas',28.0000,NULL,1,'2025-08-17 18:30:52'),(57,68,'Conchas',15.0000,NULL,1,'2025-08-17 18:33:01'),(58,52,'Cafe de Vaso',18.0000,NULL,1,'2025-08-17 19:03:23'),(59,52,'Cafe de Vaso',18.0000,NULL,1,'2025-08-17 19:03:23'),(60,54,'Te',12.0000,NULL,1,'2025-08-17 19:03:57'),(61,66,'Tortas',28.0000,NULL,1,'2025-08-17 19:04:39'),(62,66,'Tortas',28.0000,NULL,1,'2025-08-17 19:04:39'),(63,67,'Tacos',22.0000,NULL,1,'2025-08-17 19:05:11'),(64,67,'Tacos',22.0000,NULL,1,'2025-08-17 19:05:11'),(65,67,'Tacos',22.0000,NULL,1,'2025-08-17 19:05:11'),(66,67,'Tacos',22.0000,NULL,1,'2025-08-17 19:05:11'),(67,69,'Avena Sin leche',20.0000,NULL,1,'2025-08-17 19:06:12'),(68,59,'Juguitos',15.0000,NULL,1,'2025-08-17 19:07:14'),(69,60,'Cocas Chicas',18.0000,NULL,1,'2025-08-17 19:47:46'),(70,55,'Agua 600ml',11.0000,NULL,1,'2025-08-17 20:15:49'),(71,67,'Tacos',22.0000,3,1,'2025-08-17 20:16:51'),(72,67,'Tacos',22.0000,3,1,'2025-08-17 20:16:51'),(73,60,'Cocas Chicas',18.0000,3,1,'2025-08-17 20:16:51'),(74,60,'Cocas Chicas',18.0000,3,1,'2025-08-17 20:16:51'),(75,68,'Conchas',15.0000,3,1,'2025-08-17 20:16:51'),(76,69,'Avena Sin leche',20.0000,3,1,'2025-08-17 20:16:51'),(77,73,'Gomitas',8.0000,NULL,1,'2025-08-17 20:22:48'),(78,51,'Clorests 2pz',2.0000,NULL,1,'2025-08-17 20:29:47'),(79,66,'Tortas',28.0000,14,1,'2025-08-17 20:31:51'),(80,68,'Conchas',15.0000,14,1,'2025-08-17 20:31:51'),(81,60,'Cocas Chicas',18.0000,14,1,'2025-08-17 20:31:51'),(82,66,'Tortas',28.0000,4,1,'2025-08-17 20:43:02'),(83,66,'Tortas',28.0000,4,1,'2025-08-17 20:43:02'),(84,60,'Cocas Chicas',18.0000,4,1,'2025-08-17 20:43:02'),(85,28,'Mentitas 2pz',1.0000,2,1,'2025-08-17 20:47:58'),(86,28,'Mentitas 2pz',1.0000,2,1,'2025-08-17 20:47:58'),(87,66,'Tortas',28.0000,2,1,'2025-08-17 20:47:58'),(88,52,'Cafe de Vaso',18.0000,2,1,'2025-08-17 20:47:58'),(89,72,'Boing Mango 250 ml',15.0000,2,1,'2025-08-17 20:47:58'),(90,67,'Tacos',22.0000,11,1,'2025-08-17 20:50:00'),(91,67,'Tacos',22.0000,11,1,'2025-08-17 20:50:00'),(92,69,'Avena Sin leche',20.0000,5,1,'2025-08-17 20:59:13'),(93,62,'Penafiel Adas Naranja 355ml',15.0000,5,1,'2025-08-17 20:59:13'),(94,56,'Agua 1L',13.0000,NULL,1,'2025-08-17 21:00:49'),(95,1,'Yogurt Alpura Manzana Deslactosado',15.0000,6,1,'2025-08-17 21:03:23'),(96,62,'Penafiel Adas Naranja 355ml',15.0000,6,1,'2025-08-17 21:03:23'),(97,62,'Penafiel Adas Naranja 355ml',15.0000,6,1,'2025-08-17 21:03:23'),(98,66,'Tortas',28.0000,6,1,'2025-08-17 21:03:23'),(99,66,'Tortas',28.0000,6,1,'2025-08-17 21:03:23'),(100,66,'Tortas',28.0000,6,1,'2025-08-17 21:03:23'),(101,69,'Avena Sin leche',20.0000,6,1,'2025-08-17 21:03:23'),(102,67,'Tacos',22.0000,6,1,'2025-08-17 21:03:23'),(103,72,'Boing Mango 250 ml',15.0000,6,1,'2025-08-17 21:03:23'),(104,67,'Tacos',22.0000,6,1,'2025-08-17 21:03:23'),(105,20,'Galletas de avena',12.0000,6,1,'2025-08-17 21:03:23'),(106,57,'Agua 1.5L',16.0000,6,1,'2025-08-17 21:03:23'),(107,73,'Gomitas',8.0000,6,1,'2025-08-17 21:03:23'),(108,55,'Agua 600ml',11.0000,6,1,'2025-08-17 21:03:23'),(109,7,'Tarta Mix',8.0000,6,1,'2025-08-17 21:03:23'),(110,62,'Penafiel Adas Naranja 355ml',15.0000,6,1,'2025-08-17 21:03:23'),(111,4,'Mazapanes',5.0000,6,1,'2025-08-17 21:03:23'),(112,5,'Paletas payasos',15.0000,NULL,1,'2025-08-24 16:36:07'),(113,21,'Mini Gelatinas',4.0000,NULL,1,'2025-08-24 17:00:00'),(114,21,'Mini Gelatinas',4.0000,NULL,1,'2025-08-24 17:00:00'),(115,86,'Santa Clara Leche Fresa 180ml',15.0000,NULL,1,'2025-08-24 17:48:02'),(116,60,'Cocas Chicas',18.0000,NULL,1,'2025-08-24 17:48:02'),(117,58,'Santa Clara Leche Chocolate 180ml',15.0000,NULL,1,'2025-08-24 17:48:56'),(118,7,'Tarta Mix',8.0000,NULL,1,'2025-08-24 17:48:56'),(119,7,'Tarta Mix',8.0000,NULL,1,'2025-08-24 17:49:27'),(120,20,'Galletas de avena',12.0000,NULL,1,'2025-08-24 17:49:27'),(121,66,'Tortas',28.0000,NULL,1,'2025-08-24 18:04:14'),(122,66,'Tortas',28.0000,NULL,1,'2025-08-24 18:04:14'),(123,66,'Tortas',28.0000,NULL,1,'2025-08-24 18:14:59'),(124,66,'Tortas',28.0000,NULL,1,'2025-08-24 18:14:59'),(125,53,'Cafe de taza',12.0000,NULL,1,'2025-08-24 18:14:59'),(126,79,'Cereal Froot Loops',10.0000,NULL,1,'2025-08-24 18:14:59'),(127,59,'Juguitos',15.0000,NULL,1,'2025-08-24 18:14:59'),(128,87,'Rancheritos',10.0000,NULL,1,'2025-08-24 18:15:31'),(129,60,'Cocas Chicas',18.0000,2,1,'2025-08-24 18:23:37'),(130,66,'Tortas',28.0000,2,1,'2025-08-24 18:23:37'),(131,60,'Cocas Chicas',18.0000,2,1,'2025-08-24 18:23:37'),(132,67,'Tacos',18.0000,2,1,'2025-08-24 18:23:37'),(133,55,'Agua 600ml',11.0000,NULL,1,'2025-08-24 18:25:14'),(134,84,'Plati Volos',19.0000,NULL,1,'2025-08-24 18:26:08'),(135,92,'Penafiel Lata 355ml',18.0000,NULL,1,'2025-08-24 19:06:57'),(136,66,'Tortas',28.0000,NULL,1,'2025-08-24 19:20:38'),(137,68,'Conchas',15.0000,NULL,1,'2025-08-24 19:20:38'),(138,51,'Clorests 2pz',2.0000,NULL,1,'2025-08-24 19:30:22'),(139,51,'Clorests 2pz',2.0000,NULL,1,'2025-08-24 19:30:22'),(140,51,'Clorests 2pz',2.0000,NULL,1,'2025-08-24 19:30:22'),(141,51,'Clorests 2pz',2.0000,NULL,1,'2025-08-24 19:30:22'),(142,51,'Clorests 2pz',2.0000,NULL,1,'2025-08-24 19:30:22'),(143,55,'Agua 600ml',11.0000,NULL,1,'2025-08-24 19:30:22'),(144,72,'Boing Mango 250 ml',15.0000,NULL,1,'2025-08-24 19:33:00'),(145,15,'Dulcesitos',2.0000,NULL,1,'2025-08-24 19:33:00'),(146,15,'Dulcesitos',2.0000,NULL,1,'2025-08-24 19:33:00'),(147,15,'Dulcesitos',2.0000,NULL,1,'2025-08-24 19:33:00'),(148,62,'Penafiel Adas Naranja 355ml',15.0000,5,1,'2025-08-24 19:39:23'),(149,69,'Avena Sin leche',20.0000,5,1,'2025-08-24 19:39:23'),(150,69,'Avena Sin leche',20.0000,5,1,'2025-08-24 19:39:23'),(151,55,'Agua 600ml',11.0000,9,1,'2025-08-24 19:54:41'),(152,73,'Gomitas',8.0000,NULL,1,'2025-08-24 20:15:23'),(153,17,'Emperador Chicas',12.0000,NULL,1,'2025-08-24 20:15:23'),(154,66,'Tortas',28.0000,7,1,'2025-08-24 20:21:03'),(155,69,'Avena Sin leche',20.0000,NULL,1,'2025-08-24 20:25:51'),(156,55,'Agua 600ml',11.0000,NULL,1,'2025-08-31 16:44:26'),(157,69,'Avena Sin leche',20.0000,NULL,1,'2025-08-31 16:44:52'),(158,73,'Gomitas',8.0000,13,1,'2025-08-31 16:45:55'),(159,88,'Churrumais Chicos',10.0000,15,1,'2025-08-31 17:56:01'),(160,111,'Boing Guayaba Lata 340 ml',20.0000,NULL,1,'2025-08-31 17:58:39'),(161,108,'Boing Mango Lata 340 ml',20.0000,NULL,1,'2025-08-31 17:58:39'),(162,66,'Tortas',28.0000,NULL,1,'2025-08-31 17:58:39'),(163,66,'Tortas',28.0000,NULL,1,'2025-08-31 17:58:39'),(164,53,'Cafe de taza',12.0000,NULL,1,'2025-08-31 18:00:46'),(165,53,'Cafe de taza',12.0000,NULL,1,'2025-08-31 18:00:46'),(166,69,'Avena Sin leche',20.0000,NULL,1,'2025-08-31 18:01:17'),(167,57,'Agua 1.5L',16.0000,NULL,1,'2025-08-31 18:01:33'),(168,66,'Tortas',28.0000,NULL,1,'2025-08-31 18:01:48'),(169,60,'Cocas Chicas',18.0000,3,1,'2025-08-31 19:17:04'),(170,60,'Cocas Chicas',18.0000,3,1,'2025-08-31 19:17:04'),(171,92,'Penafiel Lata 355ml',18.0000,3,1,'2025-08-31 19:17:04'),(172,120,'Orden de Huevos',35.0000,3,1,'2025-08-31 19:17:04'),(173,75,'Boing Manzana 200ml',15.0000,3,1,'2025-08-31 19:17:04'),(174,117,'Huevo Hervido',7.0000,3,1,'2025-08-31 19:17:04'),(175,117,'Huevo Hervido',7.0000,3,1,'2025-08-31 19:17:04'),(176,13,'Choco Zero Rojo',18.0000,NULL,1,'2025-08-31 19:18:52'),(177,22,'Halls',12.0000,NULL,1,'2025-08-31 19:38:25'),(178,73,'Gomitas',8.0000,NULL,1,'2025-08-31 19:38:25'),(179,118,'Kinder Delice Pastelito',20.0000,NULL,1,'2025-08-31 20:08:41'),(180,66,'Tortas',28.0000,NULL,1,'2025-08-31 20:20:15'),(181,66,'Tortas',28.0000,NULL,1,'2025-08-31 20:20:15'),(182,69,'Avena Sin leche',20.0000,5,1,'2025-08-31 20:22:57'),(183,35,'Paleta Chupa Chups',2.0000,5,1,'2025-08-31 20:22:57'),(184,109,'Boing Fresa Lata 340 ml',20.0000,NULL,1,'2025-08-31 20:23:29'),(185,121,'Bubbaloo Fresa',2.0000,NULL,1,'2025-08-31 20:24:30'),(186,121,'Bubbaloo Fresa',2.0000,NULL,1,'2025-08-31 20:24:30'),(187,82,'Chokis Chicas',12.0000,NULL,1,'2025-08-31 20:25:14'),(188,10,'Arcoiris',12.0000,NULL,1,'2025-08-31 20:25:14'),(189,68,'Conchas',15.0000,2,1,'2025-08-31 20:28:05'),(190,68,'Conchas',15.0000,2,1,'2025-08-31 20:28:05'),(191,109,'Boing Fresa Lata 340 ml',20.0000,2,1,'2025-08-31 20:28:05'),(192,110,'Boing Manzana Lata 340 ml',20.0000,2,1,'2025-08-31 20:28:05'),(193,66,'Tortas',28.0000,2,1,'2025-08-31 20:28:05'),(194,66,'Tortas',28.0000,2,1,'2025-08-31 20:28:05'),(195,62,'Penafiel Adas Naranja 355ml',15.0000,2,1,'2025-08-31 20:28:05'),(196,73,'Gomitas',8.0000,NULL,1,'2025-08-31 20:28:20'),(197,90,'Rufles Queso Chicos',10.0000,NULL,1,'2025-08-31 20:28:20'),(198,80,'Choco Zero Azul',18.0000,NULL,1,'2025-08-31 20:41:29'),(199,80,'Choco Zero Azul',18.0000,NULL,1,'2025-08-31 20:41:29'),(200,51,'Clorests 2pz',2.0000,NULL,1,'2025-08-31 20:41:29'),(201,51,'Clorests 2pz',2.0000,NULL,1,'2025-08-31 20:41:29'),(202,51,'Clorests 2pz',2.0000,NULL,1,'2025-08-31 20:41:29'),(203,51,'Clorests 2pz',2.0000,NULL,1,'2025-08-31 20:41:29'),(204,51,'Clorests 2pz',2.0000,NULL,1,'2025-08-31 20:41:29'),(205,118,'Kinder Delice Pastelito',20.0000,9,1,'2025-08-31 20:41:41'),(206,108,'Boing Mango Lata 340 ml',20.0000,9,1,'2025-08-31 20:41:41'),(207,69,'Avena Sin leche',20.0000,4,1,'2025-08-31 20:56:26'),(208,71,'Mentos menta',1.0000,4,1,'2025-08-31 20:56:26'),(209,71,'Mentos menta',1.0000,4,1,'2025-08-31 20:56:26'),(210,66,'Tortas',28.0000,4,1,'2025-08-31 20:56:26'),(211,60,'Cocas Chicas',18.0000,4,1,'2025-08-31 20:56:26'),(212,69,'Avena Sin leche',20.0000,6,1,'2025-08-31 16:39:54'),(213,69,'Avena Sin leche',20.0000,6,1,'2025-08-31 16:39:54'),(214,57,'Agua 1.5L',16.0000,6,1,'2025-08-31 16:39:54'),(215,68,'Conchas',15.0000,6,1,'2025-08-31 16:39:54'),(216,68,'Conchas',15.0000,NULL,1,'2025-09-07 17:02:06'),(217,68,'Conchas',15.0000,NULL,1,'2025-09-07 17:02:06'),(218,60,'Cocas Chicas',18.0000,NULL,1,'2025-09-07 17:02:06'),(219,60,'Cocas Chicas',18.0000,NULL,1,'2025-09-07 17:02:06'),(220,75,'Boing Manzana 200ml',15.0000,NULL,1,'2025-09-07 18:05:03'),(221,28,'Mentitas 2pz',1.0000,NULL,1,'2025-09-07 18:05:45'),(222,66,'Tortas',28.0000,NULL,1,'2025-09-07 18:06:41'),(223,89,'Chetos Chicos',10.0000,NULL,1,'2025-09-07 18:08:56'),(224,89,'Chetos Chicos',10.0000,NULL,1,'2025-09-07 18:08:56'),(225,56,'Agua 1L',13.0000,NULL,1,'2025-09-07 18:08:56'),(226,53,'Cafe de taza',12.0000,NULL,1,'2025-09-07 18:08:56'),(227,66,'Tortas',28.0000,NULL,1,'2025-09-07 18:09:30'),(228,69,'Avena Sin leche',20.0000,NULL,1,'2025-09-07 18:09:39'),(229,66,'Tortas',28.0000,NULL,1,'2025-09-07 18:10:18'),(230,69,'Avena Sin leche',20.0000,NULL,1,'2025-09-07 18:10:18'),(231,52,'Cafe de Vaso',18.0000,NULL,1,'2025-09-07 18:10:18'),(232,66,'Tortas',28.0000,NULL,1,'2025-09-07 18:11:46'),(233,66,'Tortas',28.0000,NULL,1,'2025-09-07 18:11:46'),(234,66,'Tortas',28.0000,NULL,1,'2025-09-07 19:04:00'),(235,96,'Mini Mamut',5.0000,NULL,1,'2025-09-07 19:42:37'),(236,96,'Mini Mamut',5.0000,NULL,1,'2025-09-07 19:42:37'),(237,125,'Canada Dry Lata 237ml',20.0000,6,1,'2025-09-07 20:04:21'),(238,109,'Boing Fresa Lata 340 ml',20.0000,6,1,'2025-09-07 20:04:21'),(239,124,'Tlacoyo 1pz',20.0000,6,1,'2025-09-07 20:04:21'),(240,124,'Tlacoyo 1pz',20.0000,6,1,'2025-09-07 20:04:21'),(241,124,'Tlacoyo 1pz',20.0000,6,1,'2025-09-07 20:04:21'),(242,124,'Tlacoyo 1pz',20.0000,6,1,'2025-09-07 20:04:21'),(243,57,'Agua 1.5L',16.0000,6,1,'2025-09-07 20:04:21'),(244,70,'Avena con Leche',25.0000,6,1,'2025-09-07 20:04:21'),(245,70,'Avena con Leche',25.0000,6,1,'2025-09-07 20:04:21'),(246,69,'Avena Sin leche',20.0000,6,1,'2025-09-07 20:04:21'),(247,120,'Orden de Huevos',35.0000,6,1,'2025-09-07 20:04:21'),(248,109,'Boing Fresa Lata 340 ml',20.0000,6,1,'2025-09-07 20:04:21'),(249,113,'Penafiel Adas Limonada 355ml',15.0000,6,1,'2025-09-07 20:04:21'),(250,66,'Tortas',28.0000,6,1,'2025-09-07 20:04:21'),(251,66,'Tortas',28.0000,6,1,'2025-09-07 20:04:21'),(252,5,'Paletas payasos',15.0000,9,1,'2025-09-07 20:10:26'),(253,5,'Paletas payasos',15.0000,9,1,'2025-09-07 20:10:26'),(254,5,'Paletas payasos',15.0000,9,1,'2025-09-07 20:10:26'),(255,45,'Winnis 7pzs',5.0000,9,1,'2025-09-07 20:10:26'),(256,125,'Canada Dry Lata 237ml',20.0000,9,1,'2025-09-07 20:10:26'),(257,108,'Boing Mango Lata 340 ml',20.0000,9,1,'2025-09-07 20:10:26'),(258,66,'Tortas',28.0000,3,1,'2025-09-07 20:29:03'),(259,60,'Cocas Chicas',18.0000,3,1,'2025-09-07 20:29:03'),(260,53,'Cafe de taza',12.0000,3,1,'2025-09-07 20:29:03'),(261,55,'Agua 600ml',11.0000,3,1,'2025-09-07 20:29:03'),(262,60,'Cocas Chicas',18.0000,3,1,'2025-09-07 20:29:03'),(263,55,'Agua 600ml',11.0000,3,1,'2025-09-07 20:29:03'),(264,55,'Agua 600ml',11.0000,3,1,'2025-09-07 20:29:03'),(265,124,'Tlacoyo 1pz',18.0000,3,1,'2025-09-07 20:29:03'),(266,68,'Conchas',15.0000,NULL,1,'2025-09-07 20:37:48'),(267,68,'Conchas',15.0000,NULL,1,'2025-09-07 20:37:48'),(268,66,'Tortas',28.0000,2,1,'2025-09-07 20:41:37'),(269,62,'Penafiel Adas Naranja 355ml',15.0000,2,1,'2025-09-07 20:41:37'),(270,57,'Agua 1.5L',17.0000,NULL,1,'2026-01-10 21:37:04'),(271,57,'Agua 1.5L',17.0000,NULL,1,'2026-01-10 21:37:04');
/*!40000 ALTER TABLE `ventas` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-10 18:02:42
