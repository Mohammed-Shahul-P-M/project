const router = require('express').Router()
const dealerDbfunction = require('./dbfunction/dealerdbFunction')
const fs = require('fs')
const path = require('path')
const PDFDocument = require('pdfkit');
let dealerRequestedUrl = '/dealer/dashboard'
let errmsg = null
var data = {}
// function to veryfiyDealer
async function verifyDealer(req, res, next) {
    if (req.session.dealerId) next()
    else {
        if (req.url == '/dashboard') {
            errmsg = 'Sorry session is timed Out'
            dealerRequestedUrl = '/dealer' + req.url
            res.redirect('/dealer')
        } else res.json({ loginErr: 'Session timed out' })

    }
}

// login route for dealer
router.get('/', (req, res) => {

    if (req.session.dealerId) {
        res.redirect('/dealer/dashboard')
    }
    else res.render('login', { route: '/dealer/', errmsg, signuproute: '/dealer/signup', formHeading: 'Dealer login' })
    errmsg = null
})
router.post('/', (req, res) => {
    if (req.session.dealerId && req.session.Dealer) res.redirect('/dealer/dashboard')
    else {
        dealerDbfunction.doLogin(req.body).then(dealer => {
            if (dealer) {
                req.session.dealerId = dealer._id
                req.session.Dealer = dealer
                res.redirect(dealerRequestedUrl)
            } else {
                errmsg = 'password or name is wrong'
                res.redirect('/dealer')
            }
        })
    }
})
// route for dashboard of dealer 
router.get('/dashboard', verifyDealer, async (req, res) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1')
    res.header('Pragma', 'no-cache')
    let allData = await Promise.all([
        dealerDbfunction.getAllOrders(req.session.dealerId),
        dealerDbfunction.getAllOrdersHistory(req.session.dealerId),
        dealerDbfunction.getAlldata(req.session.dealerId)
    ])
    req.session.Dealer = allData[2]
    let allOrders = allData[0]
    let allOrdersHistory = (allData[1]) ? allData[1].reverse() : null
    res.render('dealer/dashboard', { dealer: req.session.Dealer, allOrders, allOrdersHistory })
})
// route to edit dealer info  from dealer dashboard 
router.post('/edit-dealerinfo', verifyDealer, async (req, res) => {
    let data = req.body
    let proPic = null
    delete data.email
    if (req.files) proPic = req.files.image
    function editDealer() {
        dealerDbfunction.editDealerInfo(data, req.session.Dealer._id).then(result => {
            let oldPic = null
            if (data.proPic) {
                if (req.session.Dealer.profilePic) {
                    oldPic = path.join(__dirname, '../public/images/pro-pics', req.session.Dealer.ProfilePic)
                    path.unlink(oldPic, err => { if (err) console.log(err); })
                }
            }
            req.session.Dealer = result
            res.json('deatails editted')
        })
    }
    if (proPic) {

        proPic.mv('./public/images/pro-pics/' + proPic.name, (err, done) => {
            if (!err) data.profilePic = proPic.name
            editDealer()
        })
    } else editDealer()


})

// route for posting data to add a product
router.post('/add-product', verifyDealer, (req, res) => {
    let data = req.body
    let dealerId = req.session.dealerId
    const productimage = req.files.img
    data.price = parseFloat(data.price)
    data.stock = parseInt(data.stock)
    if (productimage) {
        let productname = Date.now() + productimage.name
        productimage.mv('./public/images/products/' + productname, (err, done) => {
            if (!err) {
                data.prodImage = productname
                dealerDbfunction.createProduct(data, dealerId).then(result => {
                    let products = result.value.products
                    res.json(products[products.length - 1])
                }).catch(err => res.json({ errmsg: 'sorry error occured' }))
            }
            else console.log(err);
        })
    } else res.json('no images')
})
// rote to edit a specific product
router.post('/edit/product', verifyDealer, (req, res) => {
    let image = null
    imageName = null
    let data = req.body;
    delete data.stock
    data.price = parseFloat(data.price)
    dealerDbfunction.UpdateProduct(data, req.session.dealerId).then(results => {
        req.session.Dealer.products[data.index] = results[data.index]
        if (req.files) {     // if there is an image to change
            image = req.files.img
            imageName = Date.now() + image.name
            // saving new image to the server
            image.mv('./public/images/products/' + imageName, (err, done) => {
                if (!err) {
                    dealerDbfunction.updateImageName(imageName, data.id, req.session.dealerId).then(result => {
                        req.session.Dealer.products[data.index] = result[data.index]
                        res.json(result[data.index])
                        // removing old image
                        let directory = path.join(__dirname, '..', 'public/images/products/', results[data.index].prodImage)
                        fs.unlink(directory, err => {
                            if (err) console.log(err);
                        })
                    })
                } else res.json({ data: results[data.index], imgErr: 'some error occured while uploading image' })
            })
        } else res.json(results[data.index])
    })
})
//function to add stock to the server
router.post('/addStocks', verifyDealer, (req, res) => {
    req.body.stock = parseInt(req.body.stock)
    req.session.Dealer.products[req.body.index].stock += req.body.stock
    dealerDbfunction.addStock(req.body, req.session.dealerId).then(result => {
        res.json(result[req.body.index])
    })

})
// route to update timing of the shop 
router.post('/update-time', verifyDealer, (req, res) => {
    let open = `${req.body.hr[0]}:${req.body.mn[0]}:${req.body.ampm[0]}`
    let close = `${req.body.hr[1]}:${req.body.mn[1]}:${req.body.ampm[1]}`
    let data = { open: open, close: close }
    dealerDbfunction.updateTime(data, req.session.dealerId).then(result => {
        if (result) {
            req.session.Dealer.open = result.open
            req.session.Dealer.close = result.close
            res.json({ open: result.open, close: result.close })
        }
    })
})
// route to close or open the shop 
router.post('/close-shop', verifyDealer, (req, res) => {
    let openStatus = false
    if (req.body.status == 'true') openStatus = true
    dealerDbfunction.closeShop({ openStatus: openStatus }, req.session.dealerId).then(result => {
        req.session.Dealer.openStatus = result.value.openStatus
        res.json(result.value.openStatus)
    })
})
//route to desable a product
router.post('/disable', verifyDealer, (req, res) => {
    dealerDbfunction.disableProduct(req.body, req.session.dealerId).then(response => {
        if (response) {
            req.session.Dealer.products = response
            res.json('success')
        }

    }).catch(err => res.json({ errmsg: 'sorry error occured' }))
})
//route to delete a specific product
router.delete('/delete/product', verifyDealer, (req, res) => {

    dealerDbfunction.deleteProduct(req.body.id, req.session.dealerId).then(result => {
        // console.log(result);
        req.session.DoesChangeHappen = true
        res.json('ok success')
        let imagePath = path.join(__dirname, '../public', req.body.imgsrc)
        fs.unlink(imagePath, err => { if (err) console.log(err) })
    })

})
// rote to serve essential datas to the page 
router.get('/getdata', verifyDealer, (req, res) => {
    data.catogorylist = req.session.Dealer.catogories
    data.products = req.session.Dealer.products
    res.json(data)
})
// route to update catogory list 
router.post('/updatecatogory', verifyDealer, (req, res) => {

    dealerDbfunction.updateCatogory(req.body.catogory, req.session.dealerId)
    req.session.Dealer.catogories.push(req.body.catogory)
    res.json('ok')

})
// route to change password 
router.post('/change-password', verifyDealer, (req, res) => {
    dealerDbfunction.changePassword(req.body, req.session.dealerId).then(result => {
        res.json(result)
    })
})
// roter to logout 
router.get('/logout', (req, res) => {
    req.session.destroy()
    res.redirect('/dealer')
})
// route to change status of order 
router.post('/changeOrderStatus', verifyDealer, (req, res) => {


    dealerDbfunction.changeOrderStatus(req.body).then(result => {
        if (result) {
            if (req.body.status == 'rejected' && result.mop == 'online') {
                dealerDbfunction.updateUserBalance(result.user.id, result.cartTotal)
                    .then(data => req.session.Dealer = data).catch(err => console.error(err))
            }
            if (req.body.status == 'rejected' || req.body.status == 'delivered') {
                dealerDbfunction.deleteOrder(result).then(response => {
                    if (response) res.json('ok success')
                    else res.json({ err: true })
                })
            }
            else res.json('ok')
        } else res.json({ err: true })
    })

})
// function to print 
router.get('/download/:location/:id', verifyDealer, async (req, res) => {
    if (req.params.location == 'order' || 'orderhistory') {
        location = 'o'
        if (req.params.location == 'orderhistory') location = 'oh'
        let data = await dealerDbfunction.getOrderData(req.session.dealerId, location, req.params.id)
        if (data) {
            var myDoc = new PDFDocument({ bufferPages: true });

            let buffers = [];
            myDoc.on('data', buffers.push.bind(buffers));
            myDoc.on('end', () => {

                let pdfData = Buffer.concat(buffers);
                res.writeHead(200, {
                    'Content-Length': Buffer.byteLength(pdfData),
                    'Content-Type': 'application/pdf',
                    'Content-disposition': 'attachment;filename=details.pdf',
                })
                    .end(pdfData);

            });
            let content = `
                       Order_id             :   ${data._id} 
                       Store_id             :   ${data.storeId}
                       store name           :   ${data.storeName}
                       Total amont          :   ${data.cartTotal} 
                       Total items          :   ${data.TotalItem}
                       Mode of payment      :   ${data.mop}
                       ordered on           :   ${data.date}
                       Delivered on         :   ${data.finishedDate ? data.finishedDate : 'not available'}
                       Custemer name        :   ${data.user.name}
                       Customer id          :   ${data.user.id}
                       Customer Address     :   ${data.user.address + ' ph ' + data.user.phone}
                       Order status         :   ${data.status} 
                       
                       Product Details      
                       `
            data.cartItems.forEach(d => {
                let prodDetails = `
                       ${d.name} (Rs. ${d.price}/${d.unit})  x  ${d.qnt}   =  ${d.price * d.qnt}
                       `
                content += prodDetails
            })
            myDoc.font('Times-Roman')
                .fontSize(12)
                .text(`${content}`);
            myDoc.end();
        } else res.json('404 Not fuond')

    }
    else res.json('404 Not found')
})

module.exports = router