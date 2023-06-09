import express from 'express';
import axios from 'axios';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
const app = express();
const server = http.createServer(app);

const url = 'https://sbhuancayo.website/api/getpublicacionesbyanio';
app.set('view engine', 'pug');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// app.use('/styles.css', express.static(path.join(__dirname, '/public')));
app.use('/styles.css', express.static(path.join(__dirname, 'public/styles.css')));


app.get('/', async (req, res) => {
    let query = `select c.*, DATE_FORMAT(fecha_limite, '%d-%m-%Y') AS formatted_fechalimite, DATE_FORMAT(c.created_at, '%d-%m-%Y') AS fecha_subida, l.numero as n_cotizacion
    from pub_contrataciones_bienes_servicios c
    inner join log_solicitud_cotizacion l on c.idsol_cot = l.id
    where year(c.created_at)=2023
    and tipo_contratacion='B'
    and objeto NOT LIKE '%medicament%'
    and objeto NOT LIKE '%clinica%'
    and c.created_at BETWEEN DATE_SUB(NOW(), INTERVAL 1 MONTH) AND DATE_ADD(NOW(), INTERVAL 1 MONTH)
    order by fecha_limite desc
    `;
    axios.post(url,{anio:query})
    .then(({data}) => {
        let result = {
            title: 'TITLE COTIZACIONE', 
            message: 'Hello there!',
            data
        } 
        res.render('index',result);
    }).catch((err) => {
        return res.status(500).jsonp(err);
    });
});

const getCotizacion = ( id )=>{
    let query = `select * from log_solicitud_cotizacion
    where numero=${id}
    and year(fecha) = 2023
    `;
    return axios.post(url,{anio:query})
    .then(({ data }) => data)
    .catch(err => err);
} 

const getPropuestas = ( id )=>{
    let query = `select p.*,
    c.estado as estado_cuadro,
    e.razon_social, e.r_u_c,  DATE_FORMAT(p.created_at, '%d-%m-%Y A LAS %h:%i %p') AS subida
    from log_propuestabien p  
    inner join log_proveedo e on p.idproveedor = e.id  
    inner join log_cuadro_comparativo c on p.id_cuadro_comparativo = c.id 
    where c.id_solicitud_cotizacion = ${id}
    order by p.idproveedor
    `;
    return axios.post(url,{anio:query})
    .then(({ data }) => data)
    .catch(err => err);
} 

app.get('/:id', async (req, res) => {
    let cotizacion = await getCotizacion(req.params.id);

    if (cotizacion.length > 0) {
         
    } else {

    }
    
    if (cotizacion.length > 0) {
        let propuestas = await getPropuestas(cotizacion[0].id);
        let query = `call cuadro_compartivo(${cotizacion[0].id})`;
        axios.post(url,{anio:query})
        .then(({data}) => {
            let result = {
                title: 'COTIZACIONES', 
                message: 'COTIZACIONES',
                data : {
                    propuestas,
                    cc: data,
                    cotizacion: cotizacion[0]
                }
            } 
            console.log(propuestas);
            res.render('pages/cotizaciones',result);
        }).catch((err) => {
            return res.status(500).jsonp(err);
        });
    } else {
        let propuestas = [];
        let result = {
            title: 'COTIZACIONES', 
            message: 'COTIZACIONES',
            data : {
                propuestas,
                cc: [],
                cotizacion: []
            }
        } 
        console.log(propuestas);
        res.render('pages/cotizaciones',result);
    }
    
    

});

let port = process.env.PORT || 80;
server.listen(port, () => {
  console.log(`Server listening on port ${port}!`);
});