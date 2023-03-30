const express = require('express');
const axios = require('axios').default;
const app = express();
app.set('view engine', 'pug');
const url = 'https://sbhuancayo.website/api/getpublicacionesbyanio';
app.use('/styles.css', express.static(`${__dirname}/public/styles.css`));
// app.get('/', (req, res) => {
//   res.send('Hello World!');
// });

app.get('/', async (req, res) => {
    let query = `select * from log_orden_compra`;
    axios.post(url,{anio:query})
    .then(({data}) => {
        return res.status(200).jsonp(data);
    }).catch((err) => {
        return res.status(500).jsonp(err);
    });
});

app.get('/index', async (req, res) => {
    let query = `select *, DATE_FORMAT(fecha_limite, '%d-%m-%Y') AS formatted_fechalimite, DATE_FORMAT(created_at, '%d-%m-%Y') AS fecha_subida
    from pub_contrataciones_bienes_servicios 
    where year(created_at)=2023
    and tipo_contratacion='B'
    and objeto NOT LIKE '%medicament%'
    and objeto NOT LIKE '%clinica%'
    and created_at BETWEEN DATE_SUB(NOW(), INTERVAL 1 MONTH) AND DATE_ADD(NOW(), INTERVAL 1 MONTH)
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
        // return res.status(200).jsonp(data);
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
    `;
    return axios.post(url,{anio:query})
    .then(({ data }) => data)
    .catch(err => err);
} 

app.get('/cotizaciones/:id', async (req, res) => {
    let cotizacion = await getCotizacion(req.params.id);
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
    // res.render('pages/cotizaciones',result);
    // let query = `select * from log_solicitud_cotizacion
    // where numero=${req.params.id}
    // and anio = 2023
    // `;
    // axios.post(url,{anio:query})
    // .then(({data}) => {
    //     let result = {
    //         title: 'COTIZACIONES', 
    //         message: 'COTIZACIONES',
    //         data
    //     } 
    //     res.render('pages/cotizaciones',result);
    // }).catch((err) => {
    //     return res.status(500).jsonp(err);
    // });
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Backend listening on port 3000!');
});