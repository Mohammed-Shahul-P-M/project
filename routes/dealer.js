const router = require('express').Router()
const dealerDbfunction = require('./dbfunction/dealerdbFunction')

const dealer = true
let dealerRequestedUrl = '/dealer/dashboard'

// function to veryfiyDealer
function verifyDealer(req, res, next) {
    if (req.session.dealer) next()
    else {
        // dealerRequestedUrl = '/dealer' + req.url
        // res.redirect('/dealer')
        dealerDbfunction.doLogin({ name: 'shahul', password: '1234' }).then(dealer => {
            if (dealer) {
                req.session.dealer = dealer
                next()
            } else {
                dealerRequestedUrl = '/dealer' + req.url
                res.redirect('/dealer')
            }
        })
    }
}
// login route for dealer
router.get('/', (req, res) => {

    if (req.session.dealer) {
        res.redirect('/dealer/dashboard')
        // console.log(req.session.dealer);
    }
    else res.render('login', { route: '/dealer/', signuproute: '/dealer/signup' })

})
router.post('/', (req, res) => {
    if (req.session.dealer) res.redirect('/dealer/dashboard')
    else {
        dealerDbfunction.doLogin(req.body).then(dealer => {
            if (dealer) {
                req.session.dealer = dealer
                res.redirect(dealerRequestedUrl)
            } else {
                let errmsg = 'password or name is wrong'
                res.render('login', { route: '/dealer/', signuproute: '/dealer/signup', errmsg })
            }
        })
    }
})

// signup route for dealer 
router.get('/signup', (req, res) => {
    if (req.session.dealer) res.redirect('/dealer/dashboard')
    else res.render('login', { route: '/dealer/signup', signup: true, loginroute: '/dealer/' })
})
// route for dashboard of admin 
router.get('/dashboard', verifyDealer, (req, res) => {
    res.render('dealer/dashboard', { dealer })
})


module.exports = router