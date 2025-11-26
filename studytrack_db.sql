-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 26, 2025 at 05:32 AM
-- Server version: 10.4.32-MariaDB-log
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `studytrack_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `classes`
--

CREATE TABLE `classes` (
  `class_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `subject_name` varchar(100) NOT NULL,
  `instructor` varchar(100) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `repeat_days` varchar(50) DEFAULT NULL,
  `reminder_time_minutes` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `classes`
--

INSERT INTO `classes` (`class_id`, `user_id`, `subject_name`, `instructor`, `location`, `start_time`, `end_time`, `repeat_days`, `reminder_time_minutes`, `created_at`, `updated_at`) VALUES
(1, 1, 'CC 316, Application Development', 'Prof. Culanibang', 'BSIT Department CL3', '13:00:00', '17:00:00', 'Mon', 10, '2025-11-26 04:19:48', '2025-11-26 04:19:48');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `profile_pic` varchar(255) DEFAULT 'default.png',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `email`, `password_hash`, `profile_pic`, `created_at`) VALUES
(1, 'Jhon Loyd', 'Saquilon', 'sample@gmail.com', '$2y$10$NpfAPyc669/YlEssBA4Uk.LBeK9.iPicM8psMs3WYsDl4mLiHx6F2', 'default.png', '2025-11-23 10:01:54'),
(2, 'Sample', 'Two', 'sample2@gmail.c', '$2y$10$DIEaRkObunnT3wKQgGCHo.UN0UXOTkNi/xYe6p0X.kqt1DJ6HdJ1y', 'default.png', '2025-11-23 11:01:04'),
(3, 'Sample', 'Three', 'sample3@gmail.com', '$2y$10$smnwm2Sdbh4sk2rTQm9JmuCw/TkvvxfIR77T2c8b7O7BEwN.ciEjS', 'default.png', '2025-11-24 04:04:52'),
(4, 'Sample', 'Four', 'sample4@gmail.com', '$2y$10$duccprHOEFCtVqeOMQj1ZuosRUowGgAcdLcFMkAxDFWTqG91mPrJ6', 'default.png', '2025-11-24 04:08:57'),
(5, 'Sample', 'Five', 'sample5@gmail.com', '$2y$10$f5tNMk0fXw1T.i9oux.yAeFO6VhOApyI2mDDLJMEVHH5yCp/yaCxC', 'default.png', '2025-11-26 02:54:50'),
(6, 'Sample', 'Six', 'sample6@gmail.com', '$2y$10$sRjCNzHTzimgA2HDuXE5...GbCzOLxcpKcxx8IV3GUAd8lQhRRUv6', 'default.png', '2025-11-26 04:05:59');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `classes`
--
ALTER TABLE `classes`
  ADD PRIMARY KEY (`class_id`),
  ADD KEY `fk_user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `classes`
--
ALTER TABLE `classes`
  MODIFY `class_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `classes`
--
ALTER TABLE `classes`
  ADD CONSTRAINT `fk_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
