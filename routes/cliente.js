const express = require('express');
const router = express.Router();
const mysql = require('../mysql').pool;

router.get('/', (req, res, next) =>{
    res.status(200).send({
        mensagem: 'Usando rota'
    });
});

router.post('/cadastro', (req, res, next) =>{
    mysql.getConnection((error, conn) =>{
        if(error){return res.status(500).send({error: error})}
        conn.query(
            'INSERT INTO cliente (email, senha, token, user) VALUES (?,?,?,?)',
            [req.body.email, req.body.password, req.body.token, req.body.user],
            (error, resultado, field) =>{
                conn.release();

                if(error){
                    return res.status(500).send({
                        error: error,
                        response: null
                    })
                }

                res.status(201).send({
                    mensagem: 'CRIADO CLIENTE',
                    id: resultado.insertId
                });
            }
        )
    });
});



router.get('/consulta/:emailUser/:password', (req, res, next) =>{
    mysql.getConnection((error, conn) =>{
        if(error){return res.status(500).send({error: error})}

        conn.query(
            'SELECT * FROM cliente WHERE email = ? AND senha = ? OR user = ? AND senha = ?',
            [req.params.emailUser, req.params.password, req.params.emailUser, req.params.password],
            (error, resultado, field) =>{
                conn.release();

                if(error){
                    return res.status(500).send({
                        error: error,
                        response: null
                    })
                }
                let token = "";

                if(resultado.length>0){
                    token = resultado[0].token;
                }

                return res.status(200).send({
                    mensagem: 'ENCONTRADO CLIENTE',
                    token: token

                });
            }
        )
    });
});

module.exports = router;