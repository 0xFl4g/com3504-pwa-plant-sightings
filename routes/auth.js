const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication management
 */

/**
 * @swagger
 * /auth/login:
 *   get:
 *     summary: Renders the login page
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Login page rendered
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               example: '<html>...</html>'
 */
router.get('/login', (req, res) => {
  res.render('login', {title: 'Login'});
});

/**
 * @swagger
 * /auth/logout:
 *   get:
 *     summary: Renders the logout page
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout page rendered
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               example: '<html>...</html>'
 */
router.get('/logout', (req, res) => {
  res.render('logout', {title: 'Logout'});
});

module.exports = router;
