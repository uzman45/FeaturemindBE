const express = require('express');
const bodyParser=require('body-parser');
const cors = require('cors');
const fs = require('fs');
const { check, validationResult } = require('express-validator');
const fileUpload=require('express-fileupload');
const _ = require('lodash');
const app= express();

app.use(bodyParser.json());
  
  app.use(bodyParser.urlencoded({
    parameterLimit: 100000,
    extended: true 
  }));
app.use(cors());
app.use(fileUpload(
    {
        createParentPath:true,
        limits: { 
            fileSize: 2 * 1024 * 1024 * 1024 //2MB max file(s) size has been assigned
        }
    }
))






const port=process.env.PORT || 3000;
app.get('/', (req, res) => {
    res.json({message: 'Hello there Welcome to API'})
  })
app.post('/apply',[
   check('firstname').isLength({min:2,max:30}),
   check('lastname').isLength({min:2,max:30}),
   check('email').isEmail(), 
   //Custom validator for (XXX)-XXX-XXXX 
   check('phone').custom(phone => {
      return /^([0-9]( |-)?)?(\(?[0-9]{3}\)?|[0-9]{3})( |-)?([0-9]{3}( |-)?[0-9]{4}|[a-zA-Z0-9]{7})$/.test(phone)      
   }),
], async(req, res) => {
    const {firstname,lastname,email,phone} = req.body;
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(302).json({errors: errors.array() })
    }
    //allowed doc types
    const supportedDataTypes=["pdf","doc", "docx"]
    function getFileExtension(filename) {
        return (/[.]/.exec(filename)) ? /[^.]+$/.exec(filename)[0] : undefined;
      }
    try {
        if(!req.files || !req.files.resume){
            res.send({
                status:false,
                message:'No file uploaded please upload!'
            });
        }
       
        else if ( req.files.resume.name && !_.includes(supportedDataTypes,getFileExtension(req.files.resume.name)))
        {
            res.send({
                status:false,
                message:'Please upload valid format on your CV (pdf,doc,docx)'
            });
        }
        else {
            let dd = new Date()
            let ss = '' + dd.getYear() + dd.getMonth() + dd.getDate() + dd.getHours()+ dd.getMinutes()+ dd.getSeconds()
            let uploadedResume=req.files.resume;
            //I decided to format like mail-phone-daatetime(for unique folders)
            let pathForApplicant=email.replace('.','-')+'-'+phone+'-'+ss;
            uploadedResume.mv('uploads/'+pathForApplicant+'/'+uploadedResume.name);
            fs.writeFileSync('uploads/'+pathForApplicant+'/'+'applicationForm.json', JSON.stringify(req.body, null, 4));
            res.send({
                status:true,
                message: 'You applied successfuly!'
            });
        }

    }
    catch (err) {
        res.status(500).send({message:"Error:"+err});
    }
});

app.listen(port, () => console.log(`Apply for Featuremind api listening on port ${port}!`));