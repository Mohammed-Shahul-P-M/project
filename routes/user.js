const router = require('express').Router()

// home route for user 
router.get('/', (req, res) => {
    res.send('home page for user')
})




module.exports = router