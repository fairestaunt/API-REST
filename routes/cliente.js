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
        conn.query(
            'INSERT INTO cliente (nome, cpf) VALUES (?,?)',
            [req.body.nome, req.body.cpf],
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



router.get('/:id_cliente', (req, res, next) =>{
    const id = req.params.id_cliente;
    res.status(200).send({
        mensagem: 'Usando rota cliente',
        id: id 
    });
});

module.exports = router;