const express = require('express');
const router = express.Router();
const mysql = require('../mysql').pool;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.get('/', (req, res, next) =>{
    res.status(200).send({
        mensagem: 'Usando rota'
    });
});

router.post('/cadastro', (req, res, next) =>{
    mysql.getConnection((error, conn) =>{
        if(error){return res.status(500).send({error: error})}

        conn.query('SELECT * FROM login WHERE email = ?',
            [req.body.email],
            (error, results) => {
                conn.release();
                if(results.length > 0){
                    res.status(409).send({ mensagem: 'Email já cadastrado'})
                }
                else{
                    conn.query('SELECT * FROM login WHERE user = ?',
                        [req.body.user],
                        (error, results) => {
                            conn.release();
                            if(results.length > 0){
                                res.status(409).send({ mensagem: 'Usuário já cadastrado'})
                            }
                            else{

                                bcrypt.hash(req.body.password, 10, (errBcrypt, hash) => {
                                    if(errBcrypt) { return res.status(500).send({ error : errBcrypt})}
                                    conn.query(
                                        'INSERT INTO login (email, senha, user) VALUES (?,?,?)',
                                        [req.body.email, hash, req.body.user],
                                        (error, results, field) =>{
                                            conn.release();
                            
                                            if(error){
                                                return res.status(500).send({
                                                    error: error,
                                                    response: null
                                                })
                                            }
                            
                                            res.status(201).send({
                                                mensagem: 'Usuário cadastrado com sucesso',
                                                
                                                //id: resultado.insertId
                                            });
                                        })
                                });

                            }
                    });
                }
            }
        );
    });
});



router.get('/consulta/:emailUser/:password', (req, res, next) =>{
    mysql.getConnection((error, conn) =>{
        if(error){return res.status(500).send({error: error})}

        conn.query(
            'SELECT * FROM login WHERE email = ? AND senha = ? OR user = ? AND senha = ?',
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



router.get('/consultaToken/:tabela/:token', (req, res, next) =>{
    mysql.getConnection((error, conn) =>{
        if(error){return res.status(500).send({error: error})}

        conn.query(
            'SELECT * FROM ?? WHERE token = ?',
            [req.params.tabela, req.params.token],
            (error, resultado, field) =>{
                conn.release();

                if(error){
                    return res.status(500).send({
                        error: error,
                        response: null
                    })
                }
                let obj = undefined;

                if(resultado.length > 0){
                    if(!resultado[0].senha){
                        obj = resultado[0];
                    }
                    else{
                        obj = JSON.parse("{}");
                        obj.user = resultado[0].user;
                        obj.email = resultado[0].email;
                    }   
                }

                return res.status(200).send({
                    mensagem: 'ENCONTRADO CLIENTE',
                    result: obj
                });
            }
        )
    });
});




router.post('/login', (req, res, next)=>{
    mysql.getConnection((error, conn) =>{
        if(error){return res.status(500).send({error: error})}
        conn.query('SELECT * FROM login WHERE email = ? or user = ?',
            [req.body.emailUser, req.body.emailUser],
            (error, results, fields) => {
                conn.release();
                if(error){return res.status(500).send({error: error})}
                if(results.length < 1){
                    return res.status(401).send({ mensagem: 'Falha na autenticação'})
                }
                bcrypt.compare(req.body.password, results[0].senha, (err, result) => {
                    if(err){
                        return res.status(401).send({ mensagem : 'Falha na autenticação'})
                    }

                    if(result){
                        const tokenWeb = jwt.sign({
                            id_usuario: results[0].id_usuario,
                            email: results[0].email
                        }, 
                        '${process.env.JWT_KEY}', 
                        {
                            expiresIn: "1h"
                        });

                        return res.status(200).send({
                            mensagem: 'Autenticado com sucesso',
                            token: tokenWeb
                        })
                    }

                    return res.status(401).send({ mensagem : 'Falha na autenticação'})
                });
        });
    });
});

module.exports = router;