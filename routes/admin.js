const router = require('express').Router()
const adminDbFunction = require('./dbfunction/admindbfunction')
const dealerDbfunction = require('./dbfunction/adminDealer')

const formHeading = 'Admin login'
const admin = true
let loginerr = false
let requsted_url = '/admin/admin-panel'
//function to verify login
function veryfyAdmin(req, res, next) {

    if (req.session.admin) next()
    else {
        requsted_url = '/admin' + req.url
        if (req.url == '/admin-panel') res.redirect('/admin')
        else res.json({ loginerr: 'login failed' })
        loginerr = 'sorry session is timed out'
        // req.session.admin = true
        // req.session.appStatus = false
        // next()

    }
}

// home page for admin
router.get('/', (req, res) => {
    if (req.session.admin) res.redirect('/admin/admin-panel')
    else {
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.header('Expires', '-1')
        res.header('Pragma', 'no-cache')
        res.render('login', { route: '/admin', Admin: true, errmsg: loginerr, formHeading })
        loginerr = false
    }
})
// login route for admin  
router.post('/', (req, res) => {
    if (req.session.admin) res.redirect('/admin/admin-panel')
    else {
        let admindata = {
            name: req.body.name,
            password: req.body.password
        }
        adminDbFunction.doLogin(admindata).then(admin => {

            if (admin) {

                req.session.admin = true
                req.session.appStatus = admin.appStatus
                req.session.name = admin.name
                res.redirect(requsted_url)
            } else {
                loginerr = 'password or name is wrong'
                res.redirect('/admin',)
            }
        })
    }
})
// route for updating password of admin
router.post('/update', veryfyAdmin, (req, res) => {
    let admindata = {
        oldname: req.session.name,
        name: req.body.name,
        password: req.body.password
    }

    adminDbFunction.updateAdmin(admindata).then(result => {
        req.session.name = result.value.name
        res.json(result.value)
    })

})
//route for admin logout
router.get('/logout', (req, res) => {
    req.session.destroy()

    res.redirect('/admin')
})
// route for disable whole app
router.post('/disable', veryfyAdmin, (req, res) => {
    if (req.body.status === 'yes') req.body.status = false
    else if (req.body.status == 'no') req.body.status = true
    req.body.name = req.session.name
    adminDbFunction.desableApp(req.body).then(result => {

        req.session.appStatus = result.value.appStatus
        res.json({ updated: true })
    })

})
// route for admin panel 
router.get('/admin-panel', veryfyAdmin, (req, res) => {

    let banned = []
    let open = []
    let close = []
    dealerDbfunction.getallDealers().then(dealers => {
        dealers.forEach(dealer => {
            if (dealer.banned) banned.push(dealer)
            else {
                if (dealer.openStatus) open.push(dealer)
                else close.push(dealer)
            }
        })
        let opendealers = open.length
        let closeddealers = close.length
        let totalDealers = closeddealers + opendealers
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.header('Expires', '-1')
        res.header('Pragma', 'no-cache')
        res.render('admin/admin-panel', { totalDealers, opendealers, closeddealers, admin, banned, open, close, appStatus: req.session.appStatus })
    })

})
// route for create new delaer
router.post('/createDealer', veryfyAdmin, (req, res) => {
    dealerDbfunction.createDealer(req.body).then(dealer => {
        res.json(dealer)
    }).catch(err => res.json({ err: err }))
})
// route for editing a specific dealer
router.post('/editDealer', veryfyAdmin, (req, res) => {

    dealerDbfunction.editOneDealer(req.body).then(dealer => {

        res.json(dealer)
    })
})
//route for providing dealers data for admin panel 
router.get('/getdealers', (req, res) => {
    if (req.session.admin) {
        dealerDbfunction.getallDealers().then(dealers => {
            res.json(dealers)
        })
    } else res.json({ err: 'authentication faild' })

})
// route for a specific delers details
router.get('/getdealers/dealer/:dealerId', veryfyAdmin, (req, res) => {
    let data = null
    if (data) res.render('admin/dealer-info', { admin, dealerdata: data })
    dealerDbfunction.getOneDealer(req.params.dealerId).then(dealerdata => {

        if (dealerdata) res.render('admin/dealer-info', { admin, dealerdata })
        else res.render('error', { admin })
    })
})
// route for activate deactivate dealer
router.post('/dealerstatus/', veryfyAdmin, (req, res) => {

    if (req.body.banned === 'ban') {
        req.body.banned = true
        req.body.openStatus = false
    }
    else if (req.body.banned == 'unban') req.body.banned = false

    dealerDbfunction.editOneDealer(req.body).then(response => {
        res.json(response)
    })
})
// route for delete a dealer 
router.post('/deletedealer', veryfyAdmin, (req, res) => {

    dealerDbfunction.deleteDealer(req.body.id).then(response => res.json(response))
        .catch(err => res.json({ status: 'delete faild' }))
})
module.exports = router