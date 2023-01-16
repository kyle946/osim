/*
Navicat MySQL Data Transfer

Source Server         : 本地
Source Server Version : 50737
Source Host           : localhost:3306
Source Database       : osim

Target Server Type    : MYSQL
Target Server Version : 50737
File Encoding         : 65001

Date: 2023-01-16 15:48:16
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for `contact`
-- ----------------------------
DROP TABLE IF EXISTS `contact`;
CREATE TABLE `contact` (
  `id` int(12) NOT NULL AUTO_INCREMENT,
  `_from` int(12) NOT NULL COMMENT '我',
  `_to` int(12) NOT NULL COMMENT '对方',
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `state` int(1) NOT NULL DEFAULT '0',
  `sid` varchar(64) DEFAULT '' COMMENT '与对方的对话id',
  `notename` varchar(64) DEFAULT '' COMMENT '备注名字',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COMMENT='联系人';

-- ----------------------------
-- Records of contact
-- ----------------------------
INSERT INTO `contact` VALUES ('1', '3', '1', '2023-01-04 00:15:52', '1', '8EC4E7686FF597A39ABAA950F397F5B1', '');
INSERT INTO `contact` VALUES ('2', '1', '3', '2023-01-04 00:15:52', '1', '8EC4E7686FF597A39ABAA950F397F5B1', '');
INSERT INTO `contact` VALUES ('3', '4', '1', '2023-01-05 17:34:25', '1', 'a3b60101-19d4-44fa-a1cf-fa1a679dafcd', '');
INSERT INTO `contact` VALUES ('4', '1', '4', '2023-01-05 17:34:25', '1', 'a3b60101-19d4-44fa-a1cf-fa1a679dafcd', '');

-- ----------------------------
-- Table structure for `group`
-- ----------------------------
DROP TABLE IF EXISTS `group`;
CREATE TABLE `group` (
  `id` int(12) NOT NULL AUTO_INCREMENT,
  `uid` int(12) NOT NULL,
  `nickname` varchar(64) DEFAULT NULL,
  `info` varchar(255) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT '',
  `state` int(2) NOT NULL DEFAULT '1',
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sid` varchar(64) DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Records of group
-- ----------------------------
INSERT INTO `group` VALUES ('5', '1', '开发用', '做测试用的.', 'avatar/1_group_avatar.png', '1', '2023-01-06 03:31:34', 'hbkhghfghgadffgsd');

-- ----------------------------
-- Table structure for `group_member`
-- ----------------------------
DROP TABLE IF EXISTS `group_member`;
CREATE TABLE `group_member` (
  `id` int(12) NOT NULL AUTO_INCREMENT,
  `gid` int(12) NOT NULL DEFAULT '0',
  `uid` int(12) NOT NULL DEFAULT '0',
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Records of group_member
-- ----------------------------
INSERT INTO `group_member` VALUES ('1', '5', '1', '2023-01-06 03:31:34');
INSERT INTO `group_member` VALUES ('15', '5', '4', '2023-01-07 22:07:34');
INSERT INTO `group_member` VALUES ('63', '5', '3', '2023-01-09 00:30:05');

-- ----------------------------
-- Table structure for `message`
-- ----------------------------
DROP TABLE IF EXISTS `message`;
CREATE TABLE `message` (
  `id` int(15) NOT NULL AUTO_INCREMENT,
  `type` varchar(16) NOT NULL DEFAULT 'single_msg' COMMENT 'single_msg,group_msg,add_contact,join_group,exit_group,delete_contact',
  `uuid` varchar(42) DEFAULT '',
  `content` text COMMENT '消息内容',
  `_from` int(12) NOT NULL DEFAULT '0' COMMENT '谁发的',
  `uid` int(12) NOT NULL DEFAULT '0' COMMENT '发给谁',
  `gid` int(12) NOT NULL DEFAULT '0' COMMENT '发给哪个群',
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `state` int(2) NOT NULL DEFAULT '1' COMMENT '1未读,0已读',
  PRIMARY KEY (`id`),
  KEY `type` (`type`),
  KEY `state` (`state`),
  KEY `uid` (`uid`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8 COMMENT='离线消息';

-- ----------------------------
-- Records of message
-- ----------------------------
INSERT INTO `message` VALUES ('1', 'add_contact', '', '{\"remarks\":\"hello.\"}', '1', '3', '0', '2023-01-03 17:33:23', '1');
INSERT INTO `message` VALUES ('2', 'add_contact', '', '{\"remarks\":\"\"}', '1', '4', '0', '2023-01-05 17:33:37', '1');
INSERT INTO `message` VALUES ('3', 'add_contact', '', '{\"remarks\":\"\"}', '3', '1', '0', '2023-01-09 00:56:04', '1');

-- ----------------------------
-- Table structure for `users`
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(64) DEFAULT NULL,
  `passwd` varchar(64) DEFAULT NULL,
  `nickname` varchar(64) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT '',
  `info` varchar(255) NOT NULL DEFAULT '',
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  `state` int(1) NOT NULL DEFAULT '0' COMMENT '0没有昵称，1正常，-1冻结',
  `last_update_time` int(12) NOT NULL DEFAULT '0',
  `num_chat` int(9) NOT NULL DEFAULT '0',
  `num_new_contact` int(9) NOT NULL DEFAULT '0',
  `num_group` int(9) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES ('1', 'kyle946@163.com', '96e79218965eb72c92a549dd5a330112', 'OSIM作者', 'avatar/1_avatar.png', 'I am the author of OSIM software.', '2023-01-11 15:21:19', '1', '1672945906', '0', '0', '0');
INSERT INTO `users` VALUES ('2', '316686606@qq.com', '96e79218965eb72c92a549dd5a330112', '青竹丹枫', '', '', '2023-01-11 15:21:19', '0', '0', '0', '0', '0');
INSERT INTO `users` VALUES ('3', 'test100@osim.osim', '96e79218965eb72c92a549dd5a330112', '开发100', 'avatar/3_avatar.png', '这是一个开发账号.', '2023-01-11 15:21:19', '1', '1672737642', '0', '0', '0');
INSERT INTO `users` VALUES ('4', 'test101@osim.osim', '96e79218965eb72c92a549dd5a330112', '开发101', 'avatar/4_avatar.png', '第二个开发账号', '2023-01-11 15:21:19', '1', '1672911257', '0', '0', '0');
INSERT INTO `users` VALUES ('5', 'kyle1687@outlook.com', '96e79218965eb72c92a549dd5a330112', '我的OSIM', '', '', '2023-01-11 15:36:49', '0', '0', '0', '0', '0');
