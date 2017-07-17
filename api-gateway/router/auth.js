'use strict';

var express     = require('express'),
    authRouter  = express.Router(),
    service     = require('../common/service'),
    db          = require('../common/db'),
    Auth        = require('../schema/auth'),
    User        = require('../schema/user'),
    jwtOptions  = require('../common/jwt-options'),
    jwt         = require('jsonwebtoken'),
    bcrypt      = require('bcrypt-nodejs');

authRouter.post('/login', function (req, res, next) {
  if(!req.body.username || !req.body.password){
    return res.status(401).json({
      response: {
        status: 40100,
        message: "Missing login info"
      }
    });
  }

  Auth.findOne({
    'username': req.body.username
  }, function (err, data) {
    if (err){
       return res.status(401).json({
        response: {
          status: 40101,
          message: "No username found"
        }
      });
    }
    
    if (data == null || data.length == 0)
      return service.response(res, data);

    bcrypt.compare(req.body.password, data.password, function (err, isSuccess) {
      if (isSuccess) {
        // from now on we'll identify the user by the id and the id is the only personalized value that goes into our token
        var payload = service.jwtClaims(data.username);
        var token = jwt.sign(payload, jwtOptions.secretOrKey);
        return res.status(200).json({
          response: {
            status: 200,
            message: 'Success'
          },
          token: token
        });
      } else {
        return res.status(401).json({
          response: {
            status: 40102,
            message: "Wrong password"
          }
        });
      }
    });
  });
});

authRouter.post('/register', function (req, res, next) {
  bcrypt.hash(req.body.password, null, null, function (err, hash) {
    var user = new Auth({
      username: req.body.username,
      password: hash
    });
    user.save(function (err) {
      if (err) {
        next();
        if(err.name == 'ValidationError')
          return res.status(400).json({
             response: {
              status: 40000,
              message: 'Username is taken. Please choose another'
            }
          });
      }
      var payload = service.jwtClaims(user.username);
      var token = jwt.sign(payload, jwtOptions.secretOrKey);
      return res.status(201).json({
        response: {
          status: 201,
          message: 'Successfully created'
        },
        token: token
      });
    });
  });
});

module.exports = authRouter;