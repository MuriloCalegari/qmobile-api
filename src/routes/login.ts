import * as express from 'express';
import * as qauth from '../services/browser/qauth';

const route = express.Router();

route.post('/login', (req, res) => {
    if (!req.body.user || !req.body.pass) {
        return res.status(400).json({
            success: false,
            message: 'Preencha todos os campos'
        });
    }
    const user = req.body.user;
    const pass = req.body.pass;
    
});

export = route;