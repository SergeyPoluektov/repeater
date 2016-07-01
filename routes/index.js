/**
 * Created by spolu on 02.06.2016.
 */
let express = require('express');
let router = express.Router();

/* GET home page */
router.get('/', function (req, res, next) {
    res.render('index', {
        titleText: 'Repeater'
    });
});

module.exports = router;