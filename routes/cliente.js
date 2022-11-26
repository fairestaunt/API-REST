const express = require('express');
const router = express.Router();
const mysql = require('../mysql').pool;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const login = require('../middleware/login');

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


/*router.post('/consultaCampo', login, (req, res, next) =>{
    mysql.getConnection((error, conn) =>{
        if(error){return res.status(500).send({error: error})}

        conn.query('SELECT * FROM login WHERE ?? = ?',
            [req.body.campo, req.body.valor],
            (error, results) => {
                conn.release();
                if(results.length > 0){
                    res.status(409).send({ mensagem: req.body.campo + ' já cadastrado'})
                }
                else{
                    res.status(200).send({ mensagem: req.body.campo + ' não cadastrado'})
                }
        })
    })
})
    
 
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
});*/


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
                            email: results[0].email,
                            user: results[0].user
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

router.post('/consulta', login, (req, res, next)=>{
    mysql.getConnection((error, conn) =>{
        if(error){return res.status(500).send({error: error})}

        conn.query(
            'SELECT * FROM login WHERE email = ?',
            [req.usuario.email],
            (error, resultado, field) =>{
                //console.log(req.usuario.email);
                conn.release();

                if(error){
                    return res.status(500).send({
                        error: error,
                        response: null
                    })
                }

                if(resultado.length < 1){
                    return res.status(404).send({
                        mensagem: 'CLIENTE NÃO ENCONTRADO'
                    });
                }

                return res.status(200).send({
                    mensagem: 'ENCONTRADO CLIENTE',
                    response: req.usuario,
                });
            }
        )
    });
});


router.post('/cadastroCliente', (req, res, next) =>{
    mysql.getConnection((error, conn) =>{
        if(error){return res.status(500).send({error: error})}
        
        conn.query(
            'INSERT INTO cliente (email, user) VALUES (?,?)',
            [req.body.email, req.body.user],
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


router.patch('/atualizaCliente', login, (req, res, next) =>{
    mysql.getConnection((error, conn) =>{
        if(error){return res.status(500).send({error: error})}

        conn.query(
            `UPDATE cliente
                SET nome = ?,
                    sobrenome = ?,
                    telefone = ?,
                    cpfcnpj = ?,
                    idioma = ?,
                    endereco = ?,
                    cidade = ?,
                    uf = ?,
                    bairro = ?,
                    cep = ?,
                    complemento = ?,
                    pais = ?,
                    user = ?,
                    email = ?
                WHERE email = ? or user = ?`,
                [
                    req.body.nome,
                    req.body.sobrenome,
                    req.body.telefone,
                    req.body.cpfcnpj,
                    req.body.idioma,
                    req.body.endereco,
                    req.body.cidade,
                    req.body.uf,
                    req.body.bairro,
                    req.body.cep,
                    req.body.complemento,
                    req.body.pais,
                    req.body.user,
                    req.body.email,
                    req.body.emailDefault,
                    req.body.userDefault    
                ],
                (error, result, field) =>{
                    conn.release();
                    if(error){return res.status(500).send({error: error})}
                    
                    return res.status(202).send({mensagem: 'CLIENTE ATUALIZADO COM SUCESSO'})
                }
        )
    });
});

router.get('/consultaCliente', login, (req, res, next)=>{
    mysql.getConnection((error, conn) =>{
        if(error){return res.status(500).send({error: error})}

        conn.query(
            'SELECT * FROM cliente WHERE email = ?',
            [req.usuario.email],
            (error, resultado, field) =>{
                console.log(req.usuario.email);
                conn.release();

                if(error){
                    return res.status(500).send({
                        error: error,
                        response: null
                    })
                }

                if(resultado.length < 1){
                    return res.status(404).send({
                        mensagem: 'CLIENTE NÃO ENCONTRADO'
                    });
                }

                return res.status(200).send({
                    mensagem: 'ENCONTRADO CLIENTE',
                    response: resultado[0],
                });
            }
        )
    });
});


router.patch('/atualizaLogin', login, (req, res, next) =>{
    mysql.getConnection((error, conn) =>{
        if(error){return res.status(500).send({error: error})}

        conn.query(
            `UPDATE login
                SET user = ?,
                    email = ?
                WHERE email = ? or user = ?`,
                [
                    req.body.user,
                    req.body.email,
                    req.body.emailDefault,
                    req.body.userDefault    
                ],
                (error, result, field) =>{
                    conn.release();
                    if(error){return res.status(500).send({error: error})}

                    const tokenWeb = jwt.sign({
                        email: req.body.email,
                        user: req.body.user
                    }, 
                    '${process.env.JWT_KEY}', 
                    {
                        expiresIn: "1h"
                    });
                    
                    return res.status(202).send({mensagem: 'LOGIN ATUALIZADO COM SUCESSO', token: tokenWeb})
                }
        )
    });
});

module.exports = router;