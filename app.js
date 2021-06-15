let express = require("express");
let app=express();
let path = require("path");
let http = require ("http");
let server=http.createServer(app);
let bodyParser = require("body-parser");
let MongoClient = require("mongodb").MongoClient;
let cookieParser = require("cookie-parser");
let expressValidator = require("express-validator");
let url=require("url");
let urlobj = "mongodb+srv://portiontracker:portiontracker@cluster0.nzdgn.mongodb.net/portiontracker?retryWrites=true&w=majority";
let ObjectId=require("mongodb").ObjectId;
let helpers = require('./helpers');
let date = require('date-and-time');
let dt = new Date();
	let imagedate=date.format(dt,'YYYY-MM-DD');
let multer = require("multer");

let storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/images/');
    },
	
    // By default, multer removes file extensions so let's add them back
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + imagedate+'_'+Date.now()+ path.extname(file.originalname));
    }
});
app.set("views",path.join(__dirname,'views'));
app.set(express.static(path.join(__dirname,'./views')));
app.use(bodyParser.urlencoded({extended:false}));
app.set("view engine","ejs");
app.use(cookieParser());
app.set(express.static(path.join(__dirname, ('/public'))));
app.use( express.static( "public" ));
let otp = Math.random();
otp = otp * 1000000;
otp = parseInt(otp);
let userid,otpobj,op,urlparam,studid,teachid,courseid,cmname=[];
let mailer = require("nodemailer");
let transporter = mailer.createTransport({
	service:'gmail',
	auth:{
		user:'aulaclassrooms@gmail.com',
		pass:'Aula@1234'
	}
});
app.get("/",function(req,res){
	res.sendFile(path.join(__dirname,'./views/index.html'));	
});
app.get("/login",function(req,res){
	 userid=req.cookies["userid"];
	if(userid==null || userid=="")
	res.render("login",{responseMessage:""});
	if(userid!=null || userid!="")
	{
		let result=userid;
		op=result.slice(0,31);
		MongoClient.connect(urlobj,{ useUnifiedTopology: true },function(err,db){
			if(err) throw err;
			else
			{
				let dataobj = db.db("portiontracker");
				dataobj.collection("users").find({_id:ObjectId(op)}).toArray(function(err,data){
					if(err) throw err;
					else{
					if(data.length!=0)
					{
						if(data[0].cookieid=="1")
						res.redirect("/adminportal");
						else if(data[0].cookieid=="0"){
						res.redirect("/cmportal");
						db.close();
					}
			}
					else{
					res.render("login",{responseMessage:""});
					db.close();
				}
			}
			});
	
}
		});
		}
	});
app.post("/login",function(req,res){
	let email=req.body.email;
	let password=req.body.password;
	MongoClient.connect(urlobj,{ useUnifiedTopology: true },function(err,db){
		if(err) throw err;
		else
		{
			let dataobj = db.db("portiontracker");
			dataobj.collection("users").find({email:email,password:password}).toArray(function(err,data){
	
				if (err) throw err;
				else{
				if(data.length!=0)
				{
					
					if(data[0].cookieid=="1"){
						res.cookie("userid",data[0]._id,{expire:Date.now()+3600});
						res.redirect("/adminportal");
						db.close();
					}
					else if(data[0].cookieid=="0"){
						res.cookie("userid",data[0]._id,{expire:Date.now()+3600});
						res.redirect("/cmportal");
						db.close();
					}
				}
					else
					{
						res.render("login",{responseMessage:"Wrong"});
					db.close();
				}
			}
			});
		}
	});
});
app.post("/signup",function(req,res){
	let name=req.body.name;
	let email=req.body.email;
	let newpassword=req.body.password;
	let confirmpassword=req.body.confirmpassword;
	let contact=req.body.contact;
	let branch=req.body.branch;
	if(newpassword!=confirmpassword)
	{
		res.render("signup",{responseMessage:"passnotmatch"});
	}
	else{
		let  docobj={
            name:name,
            email:email,
            password:newpassword,
			contact:contact,
			branch:branch,
			cookieid:"0"
        };
		otpobj=docobj;
	MongoClient.connect(urlobj,{ useUnifiedTopology: true },function(err,db){
		if(err) throw err;
		else
		{
			let dataobj = db.db("portiontracker");
			dataobj.collection("users").find({email:email}).toArray(function(err,data){
				if(data.length!=0)
				{
					res.render("signup",{responseMessage:"Exist"});
					db.close();
				}
				else{
					let otpmail={
						from:'aulaclassrooms@gmail.com',
						to:email,
						subject:'OTP Authentication',
						text:'Hi Your OTP is '+otp
					};	
					transporter.sendMail(otpmail,function(error,information){
						if(error) throw error
						else
							if(information.response){
								res.render("otpverify",{responseMessage:""});
								db.close();
							}
					});
				}
			});
				}
			});
	}
});
app.get("/signup",function(req,res){
	let userid=req.cookies["userid"];
	if(userid==null || userid=="")
	res.render("signup",{responseMessage:""});
	if(userid!=null || userid!="")
	{
		let result=userid;
		 op=result.slice(0,31);
		MongoClient.connect(urlobj,{ useUnifiedTopology: true },function(err,db){
			if(err) throw err;
			else
			{
				let dataobj = db.db("portiontracker");
				dataobj.collection("users").find({_id:ObjectId(op)}).toArray(function(err,data){
					if(err) throw err;
					else{
					if(data.length!=0)
					{
						if(data[0].cookieid=="1")
						res.redirect("/adminportal");
						else if(data[0].cookieid=="0"){
						res.redirect("/cmportal");
					db.close();
					}
				}
					else{
					res.render("signup",{responseMessage:""});
					db.close();
				}
			}
			});
	
}
		});
		}
});
app.get("/logout",function(req,res){
	res.clearCookie("userid");
	res.redirect("/");
});
app.get("/cmportal",function(req,res){
	let userid=req.cookies["userid"];
	if(userid!=null || userid!="")
	{
	MongoClient.connect(urlobj,{ useUnifiedTopology: true },function(err,db){
		if(err) throw err;
		else
		{
			let dataobj = db.db("portiontracker");
			dataobj.collection("users").find({_id:ObjectId(userid)}).toArray(function(err,data){
				if(err) throw err;
				else{
					res.render("cmportal",{name:data[0].name});
				}
			});
		}
	});
}
});
app.get("/adminportal",function(req,res){
	let userid=req.cookies["userid"];
	if(userid!=null || userid!="")
	res.render("adminportal",{});
	});
app.get("/forgotpassword",function(req,res){
	res.render("forgotpassword",{responseMessage:""});
});
app.post("/forgotpassword",function(req,res){
	let name=req.body.name;
	let email=req.body.email;
	MongoClient.connect(urlobj,{ useUnifiedTopology: true },function(err,db){
		if(err) throw err;
		else
		{
			let dataobj = db.db("portiontracker");
			dataobj.collection("users").find({name:name,email:email}).toArray(function(err,data){
				if(err) throw err;
				else{
				if(data.length!=0)
				{
					let forgotpassmail={
						from:'aulaclassrooms@gmail.com',
						to:email,
						subject:'Forgot Password',
						text:'Hi '+name+' Your password is '+data[0].password
					};	
					transporter.sendMail(forgotpassmail,function(error,information){
						if(error) throw error
						else
							if(information.response){
								res.render("forgotpassword",{responseMessage:"Success"});
							}
					});
				db.close();
				}
				else{
				res.render("forgotpassword",{responseMessage:"NoExist"});
				db.close();
			}
		}
		});

}
	});
});
app.get("/otpverify",function(req,res){
	res.render("otpverify",{responseMessage:""});
});
app.post("/otpverify",function(req,res){
	let verifyotp=req.body.otpcheck;
	if(verifyotp==otp)
	{
		MongoClient.connect(urlobj,{ useUnifiedTopology: true },function(err,db){
			if(err) throw err;
			else
			{
				let dataobj = db.db("portiontracker");
				dataobj.collection("users").insertOne(otpobj,function(err,data){
					if(err) throw err;
					else{
						res.render("signup",{responseMessage:"Success"});
						}
});
}
			});
		}
		else
		res.render("otpverify",{responseMessage:"Error"});
});
app.get("/resend",function(req,res){
	otp = Math.random();
	otp = otp * 1000000;
	otp = parseInt(otp);
	let mailer = require("nodemailer");
	let transporter = mailer.createTransport({
		service:'gmail',
		auth:{
			user:'aulaclassrooms@gmail.com',
			pass:'Aula@1234'
		}
	});
	let otpmail={
		from:'aulaclassrooms@gmail.com',
		to:otpobj.email,
		subject:'OTP Authentication',
		text:'Hi Your OTP is '+otp
	};	
	transporter.sendMail(otpmail,function(error,information){
		if(error) throw error
		else
			if(information.response){
				res.redirect("/otpverify");
			}
	});
});
app.get("/about",function(req,res){
	res.render("about",{});
});
app.get("/courselist",function(req,res){
	MongoClient.connect(urlobj,{ useUnifiedTopology: true },function(err,db){
		if(err) throw err;
		else
		{
			let dataobj = db.db("portiontracker");
			dataobj.collection("courselist").find({}).toArray(function(err,data){
				if(err) throw err;
				else{
					if(data.length!=0 && data!="")
					{
							res.render("courselist",{courselist:JSON.stringify(data)});
						
					}
					else
					res.render("courselist",{courselist:"Error"});
				}
});
		}
	});
});
app.get("/viewcourses",function(req,res){
	MongoClient.connect(urlobj,{ useUnifiedTopology: true },function(err,db){
		if(err) throw err;
		else
		{
			let dataobj = db.db("portiontracker");
			dataobj.collection("courselist").find({}).toArray(function(err,data){
				if(err) throw err;
				else{
					if(data.length!=0 && data!="")
					{
							res.render("viewcourses",{courselist:JSON.stringify(data)});
						
					}
					else
					res.render("viewcourses",{courselist:"Error"});
				}
});
		}
	});
});
app.get("/newstudent",function(req,res){
	let uid=req.cookies["userid"];
	if(uid!=0 && uid!="")
	{
		MongoClient.connect(urlobj,{ useUnifiedTopology: true },function(err,db){
			if(err) throw err;
			else
			{
				let dataobj = db.db("portiontracker");
				dataobj.collection("users").find({_id:ObjectId(uid)}).toArray(function(err,data){
					if (err) throw err
					else
					{	
						if(data.length!=0)
						{
							res.render("newstudent",{message:data[0].branch});
						}
						else
						{
							res.render("newstudent",{message:""});
						}
					}
				});
			}
		});
	}
});
app.post("/newstudent",function(req,res){
	let name=req.body.name;
	let email=req.body.email;
	let jdate=req.body.jdate;
	let contact=req.body.contact;
	let branch=req.body.branch;
		let  docobj={
            name:name,
            email:email,
            joiningdate:jdate,
			contact:contact,
			branch:branch
        };
	MongoClient.connect(urlobj,{ useUnifiedTopology: true },function(err,db){
		if(err) throw err;
		else
		{
			let dataobj = db.db("portiontracker");
			dataobj.collection("students").insertOne(docobj,function(err,data){
				if (err) throw err
				else{
					res.render("newstudent",{message:"Success"});
				}
			});
		}
	});
});
app.get("/viewstudents",function(req,res){
	let uid=req.cookies["userid"];
	if(uid!=0 && uid!="")
	{
		MongoClient.connect(urlobj,{ useUnifiedTopology: true },function(err,db){
			if(err) throw err;
			else
			{
				let dataobj = db.db("portiontracker");
				dataobj.collection("users").find({_id:ObjectId(uid)}).toArray(function(err,data){
					if (err) throw err
					else
					{	
						if(data.length!=0)
						{ 
							let branch=data[0].branch
						dataobj.collection("students").find({branch:branch}).toArray(function(err,studdata){
						if(err) throw err;
					else{
					if(studdata.length!=0)
					{
							res.render("viewstudents",{studentlist:JSON.stringify(studdata)});		
					}
					else
					{
					res.render("viewstudents",{studentlist:"Error"});
					db.close();
					}
				}
			});
				}
			}
		});
}
		});
	}
});
app.get("/studupdate",function(req,res){
	urlparam = url.parse(req.url,true);
	studid = urlparam.query.id;
	MongoClient.connect(urlobj,{ useUnifiedTopology: true },function(err,db){
		if(err) throw err;
		else
		{
			let dataobj = db.db("portiontracker");
			dataobj.collection("students").find({_id:ObjectId(studid)}).toArray(function(err,data){
				if (err) throw err
				else{
					if(data.length!=0)
					{
					res.render("studupdate",{message:{name:data[0].name,email:data[0].email,jdate:data[0].joiningdate,contact:data[0].contact,branch:data[0].branch}});
				}
				else
				res.render("studupdate",{message:""});
			}
			});
		}
	});
});
app.post("/studupdate",function(req,res){
	let name=req.body.name;
	let email=req.body.email;
	let jdate=req.body.jdate;
	let contact=req.body.contact;
	let branch=req.body.branch;
	let dt = new Date();
	if(jdate<=date.format(dt,'YYYY-MM-DD'))
	{
		let query={
			_id:ObjectId(studid)
		}
		let  docobj={
			$set:{
            name:name,
            email:email,
            joiningdate:jdate,
			contact:contact,
			branch:branch
		}};
	MongoClient.connect(urlobj,{ useUnifiedTopology: true },function(err,db){
		if(err) throw err;
		else
		{
			let dataobj = db.db("portiontracker");
			dataobj.collection("students").updateOne(query,docobj,function(err,data){
				if (err) throw err
				else{
					res.render("studupdate",{message:"Success"});
				}
			});
		}
	});
}
else
{
	res.render("studupdate",{message:"DateError"});
}
	});
app.get("/studdelete",function(req,res){
	urlparam = url.parse(req.url,true);
	studid = urlparam.query.id;
	MongoClient.connect(urlobj,{ useUnifiedTopology: true },function(err,db){
		if(err) throw err;
		else
		{
			let dataobj = db.db("portiontracker");
			dataobj.collection("students").deleteOne({_id:ObjectId(studid)},function(err,data){
				if (err) throw err
				else
				{
						res.redirect("/viewstudents");
				}
			});
			}
			
	});

});
app.get("/teachdelete",function(req,res){
	urlparam = url.parse(req.url,true);
	teachid = urlparam.query.id;
	MongoClient.connect(urlobj,{ useUnifiedTopology: true },function(err,db){
		if(err) throw err;
		else
		{
			let dataobj = db.db("portiontracker");
			dataobj.collection("teacher").deleteOne({_id:ObjectId(teachid)},function(err,data){
				if (err) throw err
				else
				{
					res.redirect("/viewteachers");
				}
			});
			}
			
	});

});
app.get("/newteacher",function(req,res){
	let uid=req.cookies["userid"];
	if(uid!=0 && uid!="")
	{
		MongoClient.connect(urlobj,{ useUnifiedTopology: true },function(err,db){
			if(err) throw err;
			else
			{
				let dataobj = db.db("portiontracker");
				dataobj.collection("users").find({_id:ObjectId(uid)}).toArray(function(err,data){
					if (err) throw err
					else
					{	
						if(data.length!=0)
						{
							res.render("newteacher",{message:data[0].branch});
						}
						else
						{
						res.render("newteacher",{message:""});
						db.close();
					}
				}
			});
		}
	});
}
});
app.post("/newteacher",function(req,res){
	MongoClient.connect(urlobj,{ useUnifiedTopology: true },function(err,db){
		if(err) throw err;
		else
		{
			let upload = multer({ storage: storage, fileFilter: helpers.imageFilter }).single('profilepic');
			
			upload(req, res, function(err) {
				let  docobj={
					name:req.body.name,
					email:req.body.email,
					joiningdate:req.body.jdate,
					contact:req.body.contact,
					branch:req.body.branch,
					workhour:req.body.workhour,
					payment:req.body.payment,
					profileimage:req.file.path
				};
				let dt = new Date();
				if(req.body.jdate<=date.format(dt,'YYYY-MM-DD'))
				{
			let dataobj = db.db("portiontracker");
			dataobj.collection("teacher").insertOne(docobj,function(err,data){
				if (err) throw err
				else{
					res.render("newteacher",{message:"Success"});
				}
			});
		}
		else
		{
			res.render("newteacher",{message:"DateError"});	
		}
		});
		}
	});
});
app.get("/viewteachers",function(req,res){
	let uid=req.cookies["userid"];
	if(uid!=0 && uid!="")
	{
		MongoClient.connect(urlobj,{ useUnifiedTopology: true },function(err,db){
			if(err) throw err;
			else
			{
				let dataobj = db.db("portiontracker");
				dataobj.collection("users").find({_id:ObjectId(uid)}).toArray(function(err,data){
					if (err) throw err
					else
					{	
						if(data.length!=0)
						{ let branch=data[0].branch;	
			dataobj.collection("teacher").find({branch:branch}).toArray(function(err,data){
				if(err) throw err;
				else{
					if(data.length!=0)
					{
							res.render("viewteachers",{teacherlist:JSON.stringify(data)});
						
					}
					else
					{
					res.render("viewteachers",{teacherlist:"Error"});
						db.close();
				}
				}
			});
}
		}
	});
}
		});
	}
});
app.get("/teachupdate",function(req,res){
	urlparam = url.parse(req.url,true);
	teachid = urlparam.query.id;
	MongoClient.connect(urlobj,{ useUnifiedTopology: true },function(err,db){
		if(err) throw err;
		else
		{
			let dataobj = db.db("portiontracker");
			dataobj.collection("teacher").find({_id:ObjectId(teachid)}).toArray(function(err,data){
				if (err) throw err
				else{
					if(data.length!=0)
					{
					res.render("teachupdate",{message:{name:data[0].name,email:data[0].email,jdate:data[0].joiningdate,contact:data[0].contact,branch:data[0].branch,workhour:data[0].workhour,payment:data[0].payment}});
				}
				else
				res.render("teachupdate",{message:""});
			}
			});
		}
	});
});
app.post("/teachupdate",function(req,res){
	
	let query={
			_id:ObjectId(teachid)
		}	
	MongoClient.connect(urlobj,{ useUnifiedTopology: true },function(err,db){
		if(err) throw err;
		else
		{
			
			let upload = multer({ storage: storage, fileFilter: helpers.imageFilter }).single('profilepic');
			
			upload(req, res, function(err) {
				
				if(req.file!=undefined)
		{
			
				let dataobj = db.db("portiontracker");
		let  docobj={
			$set:{
			name:req.body.name,
			email:req.body.email,
			joiningdate:req.body.jdate,
			contact:req.body.contact,
			branch:req.body.branch,
			workhour:req.body.workhour,
			payment:req.body.payment,
			profileimage:req.file.path
		}};
		
		let dt = new Date();
				if(req.body.jdate<=date.format(dt,'YYYY-MM-DD'))
				{
	
	dataobj.collection("teacher").updateOne(query,docobj,function(err,data){
		if (err) throw err
		else{
			res.render("teachupdate",{message:"Success"});
		}
	});
}
else
{
	res.render("teachupdate",{message:"DateError"});	
}
		}
	
		if(req.file==undefined)
		{let dataobj = db.db("portiontracker");
			dataobj.collection("teacher").find({_id:ObjectId(teachid)}).toArray(function(err,data){
				if (err) throw err
				else{
					let  docobj={
						$set:{
						name:req.body.name,
						email:req.body.email,
						joiningdate:req.body.jdate,
						contact:req.body.contact,
						branch:req.body.branch,
						workhour:req.body.workhour,
						payment:req.body.payment,
						profileimage:data[0].profileimage
					}};
					let dt = new Date();
				if(req.body.jdate<=date.format(dt,'YYYY-MM-DD'))
				{
					dataobj.collection("teacher").updateOne(query,docobj,function(err,data){
						if (err) throw err
						else{
							res.render("teachupdate",{message:"Success"});
						}
					});
				 	}
			
				else
				{
					res.render("teachupdate",{message:"DateError"});	
				}
			}
			});
		}
	});
		
		}
	});
	});
app.get("/newcourse",function(req,res){
res.render("newcourse",{message:""});
});
app.post("/newcourse",function(req,res){
	let coursename=req.body.coursename;
	let description=req.body.description;
	let sdate=req.body.sdate;
	let fee=req.body.fee;
		let  docobj={
            coursename:coursename,
            description:description,
            startdate:sdate,
			fee:fee
        };
	MongoClient.connect(urlobj,{ useUnifiedTopology: true },function(err,db){
		if(err) throw err;
		else
		{
			let dataobj = db.db("portiontracker");
			dataobj.collection("courselist").insertOne(docobj,function(err,data){
				if (err) throw err
				else{
					res.render("newcourse",{message:"Success"});
				}
			});
		}
	});
});
app.get("/courseupdate",function(req,res){
	urlparam = url.parse(req.url,true);
	courseid = urlparam.query.id;
	MongoClient.connect(urlobj,{ useUnifiedTopology: true },function(err,db){
		if(err) throw err;
		else
		{
			let dataobj = db.db("portiontracker");
			dataobj.collection("courselist").find({_id:ObjectId(courseid)}).toArray(function(err,data){
				if (err) throw err
				else{
					if(data.length!=0)
					{
					res.render("courseupdate",{message:{coursename:data[0].coursename,description:data[0].description,sdate:data[0].startdate,fee:data[0].fee}});
				}
				else
				res.render("courseupdate",{message:""});
			}
			});
		}
	});
});
app.post("/courseupdate",function(req,res){
	let coursename=req.body.coursename;
	let description=req.body.description;
	let sdate=req.body.sdate;
	let fee=req.body.fee;
	let query={
		_id:ObjectId(courseid)
	}
		let  docobj={
			$set:{
            coursename:coursename,
            description:description,
            startdate:sdate,
			fee:fee
			}
		};
	MongoClient.connect(urlobj,{ useUnifiedTopology: true },function(err,db){
		if(err) throw err;
		else
		{
			let dataobj = db.db("portiontracker");
			dataobj.collection("courselist").updateOne(query,docobj,function(err,data){
				if (err) throw err
				else{
					res.render("courseupdate",{message:"Success"});
				}
			});
		}
	});
});
app.get("/coursedelete",function(req,res){
	urlparam = url.parse(req.url,true);
	courseid = urlparam.query.id;
	MongoClient.connect(urlobj,{ useUnifiedTopology: true },function(err,db){
		if(err) throw err;
		else
		{
			let dataobj = db.db("portiontracker");
			dataobj.collection("courselist").deleteOne({_id:ObjectId(courseid)},function(err,data){
				if (err) throw err
				else
				{
					res.redirect("/viewcourses");
				}
			});
			}
			
	});
});
app.get("/lecturedetails",function(req,res){
	let cmid=req.cookies["userid"];
	let cmbranch;
	MongoClient.connect(urlobj,{ useUnifiedTopology: true },function(err,db){
		if(err) throw err;
		else
		{
			let dataobj = db.db("portiontracker");
			dataobj.collection("users").find({_id:ObjectId(cmid)}).toArray(function(err,cmdata){
				if(err) throw err;
				else{
					if(cmdata.length!=0)
					{
						 cmbranch=cmdata[0].branch;
					}
			dataobj.collection("students").find({branch:cmbranch}).toArray(function(err,studdata){
				if (err) throw err
				else{
					if(studdata.length!=0)
					{
						dataobj.collection("teacher").find({branch:cmbranch}).toArray(function(err,teachdata){
							if (err) throw err
							else{
								if(teachdata.length!=0)
								{
									dataobj.collection("courselist").find({}).toArray(function(err,coursedata){
										if (err) throw err
										else{
											if(coursedata.length!=0)
											{
												res.render("lecturedetails",{message:"",student:JSON.stringify(studdata),teacher:JSON.stringify(teachdata),course:JSON.stringify(coursedata)});
											}
										}
									});
								}
							}
						});
					}

				}
			});
		}
	});
		}
	});	
});
app.post("/lecturedetails",function(req,res){
	let studentname=req.body.sname;
	let teachername=req.body.tname;
	let coursename=req.body.cname;
	let classdate=req.body.cdate;
	let starttime=req.body.stime;
	let endtime=req.body.etime;
	let chaptername=req.body.chapname;
	let topicscovered=req.body.topics;
	let testtopics=req.body.testtopics;
	let testmarks=req.body.marks;
	let dt = new Date();
	MongoClient.connect(urlobj,{ useUnifiedTopology: true },function(err,db){
		if(err) throw err;
		else
		{
			let dataobj = db.db("portiontracker");
			dataobj.collection("students").find({name:studentname}).toArray(function(err,studentdata){
				if (err) throw err
				else{
					if(classdate>=studentdata[0].joiningdate)
					{
						dataobj.collection("teacher").find({name:teachername}).toArray(function(err,teacherdata){
							if (err) throw err
							else{
								if(classdate>=teacherdata[0].joiningdate)
								{

	if(classdate<=date.format(dt,'YYYY-MM-DD'))
	{
	if(starttime<endtime){
	
		let  docobj={
            studentname:studentname,
			teachername:teachername,
			coursename:coursename,
			classdate:classdate,
			classstarttime:starttime,
			classendtime:endtime,
			chaptername:chaptername,
			topicscovered:topicscovered,
			testtopics:testtopics,
			marksobtained:testmarks,
			classmanagerid:req.cookies["userid"]
        };
			dataobj.collection("students").find({}).toArray(function(err,studdata){
				if (err) throw err
				else{
					dataobj.collection("teacher").find({}).toArray(function(err,teachdata){
						if (err) throw err
						else{
							dataobj.collection("courselist").find({}).toArray(function(err,coursedata){
								if (err) throw err
								else{
			dataobj.collection("lecturedetails").find({teachername:teachername,classdate:classdate,classstarttime:starttime}).toArray(function(err,data){
				if (err) throw err
				else{
					if(data.length==0)
					{
			dataobj.collection("lecturedetails").insertOne(docobj,function(err,data){
				if (err) throw err
				else{
					res.render("lecturedetails",{message:"Success",student:JSON.stringify(studdata),teacher:JSON.stringify(teachdata),course:JSON.stringify(coursedata)});
				}
			});
		}
		else
		res.render("lecturedetails",{message:"Error"});
	}
});
		}
	});
}
					});
				}
			});
		}
	else
	{
		res.render("lecturedetails",{message:"TimeError"});
	}
}
else
{
	res.render("lecturedetails",{message:"DateError"});
}
}
else
{
	res.render("lecturedetails",{message:"TJoinError"});
}
}
});
}
else
{
	res.render("lecturedetails",{message:"SJoinError"});
}
}
});
}
});
});
app.get("/viewcourselist",function(req,res){
	MongoClient.connect(urlobj,{ useUnifiedTopology: true },function(err,db){
		if(err) throw err;
		else
		{
			let dataobj = db.db("portiontracker");
			dataobj.collection("courselist").find({}).toArray(function(err,data){
				if(err) throw err;
				else{
					if(data.length!=0 && data!="")
					{
							res.render("viewcourselist",{courselist:JSON.stringify(data)});
						
					}
					else
					res.render("viewcourselist",{courselist:"Error"});
				}
});
		}
	});
});
app.get("/viewlecturedetails",function(req,res){
	MongoClient.connect(urlobj,{ useUnifiedTopology: true },function(err,db){
		if(err) throw err;
		else
		{
			let dataobj = db.db("portiontracker");
			dataobj.collection("students").find({}).toArray(function(err,studdata){
				if (err) throw err;
				else
					{
						dataobj.collection("teacher").find({}).toArray(function(err,teachdata){
							if (err) throw err;
							else
								{
									dataobj.collection("lecturedetails").find({}).toArray(function(err,lecturedata){
							if (err) throw err;
							else
								{	
									for(let i=0;i<lecturedata.length;i++)
									{
									dataobj.collection("users").find({_id:ObjectId(lecturedata[i].classmanagerid)}).toArray(function(err,cmdata){
										if (err) throw err;
										else
											{	
												cmname[i]=cmdata[0].name;
											}
										});
									}
									res.render("viewlecturedetails",{lecturelist:JSON.stringify(lecturedata),student:JSON.stringify(studdata),teacher:JSON.stringify(teachdata),cm:cmname});
								}
							});
						}
					});
				}
			});
		}
	});				
});
app.post("/filterlecturedetails",function(req,res){
let studname=req.body.student;
let teachname=req.body.teacher;
if(studname=="" && teachname=="")
{
	res.render("viewlecturedetails",{lecturelist:"nofilter"});
}
if(studname!="" && teachname=="")
{
	MongoClient.connect(urlobj,{ useUnifiedTopology: true },function(err,db){
		if(err) throw err;
		else
		{
			let dataobj = db.db("portiontracker");
			dataobj.collection("students").find({}).toArray(function(err,studentdata){
				if (err) throw err;
				else
					{
						dataobj.collection("teacher").find({}).toArray(function(err,teacherdata){
							if (err) throw err;
							else
								{
									dataobj.collection("lecturedetails").find({studentname:studname}).toArray(function(err,sdata){
										if (err) throw err;
										else
											{
												if(sdata.length!=0)
												{
													dataobj.collection("users").find({_id:ObjectId(sdata[0].classmanagerid)}).toArray(function(err,cmiddata){
														if (err) throw err;
														else
															{
																res.render("filterlecturedetails",{filter:JSON.stringify(sdata),cmname:cmiddata[0].name,student:JSON.stringify(studentdata),teacher:JSON.stringify(teacherdata)})
															}
														});
												}
												else
												{
													res.render("filterlecturedetails",{filter:JSON.stringify(sdata),cmname:"",student:JSON.stringify(studentdata),teacher:JSON.stringify(teacherdata)})
												}

											}
										});							
								}
							});
						}
					});
				}
			});
}
if(studname==""&& teachname!="")
{
	MongoClient.connect(urlobj,{ useUnifiedTopology: true },function(err,db){
		if(err) throw err;
		else
		{
			let dataobj = db.db("portiontracker");
			dataobj.collection("students").find({}).toArray(function(err,studentdata){
				if (err) throw err;
				else
					{
						dataobj.collection("teacher").find({}).toArray(function(err,teacherdata){
							if (err) throw err;
							else
								{
									dataobj.collection("lecturedetails").find({teachername:teachname}).toArray(function(err,tdata){
										if (err) throw err;
										else
											{
												if(tdata.length!=0)
												{
													dataobj.collection("users").find({_id:ObjectId(tdata[0].classmanagerid)}).toArray(function(err,cmiddata){
														if (err) throw err;
														else
															{
																res.render("filterlecturedetails",{filter:JSON.stringify(tdata),cmname:cmiddata[0].name,student:JSON.stringify(studentdata),teacher:JSON.stringify(teacherdata)})
															}
														});
												}
												else
												{
													res.render("filterlecturedetails",{filter:JSON.stringify(tdata),cmname:"",student:JSON.stringify(studentdata),teacher:JSON.stringify(teacherdata)})
												}
											}
										});							
								}
							});
						}
					});
				}
			});
}
if(studname!="" && teachname!="")
{
	MongoClient.connect(urlobj,{ useUnifiedTopology: true },function(err,db){
		if(err) throw err;
		else
		{
			let dataobj = db.db("portiontracker");
			dataobj.collection("students").find({}).toArray(function(err,studentdata){
				if (err) throw err;
				else
					{
						dataobj.collection("teacher").find({}).toArray(function(err,teacherdata){
							if (err) throw err;
							else
								{
									dataobj.collection("lecturedetails").find({studentname:studname,teachername:teachname}).toArray(function(err,data){
										if (err) throw err;
										else
											{
												if(data.length!=0)
												{
													dataobj.collection("users").find({_id:ObjectId(data[0].classmanagerid)}).toArray(function(err,cmiddata){
														if (err) throw err;
														else
															{
																res.render("filterlecturedetails",{filter:JSON.stringify(data),cmname:cmiddata[0].name,student:JSON.stringify(studentdata),teacher:JSON.stringify(teacherdata)})
															}
														});
												}
												else
												{
													res.render("filterlecturedetails",{filter:JSON.stringify(data),cmname:"",student:JSON.stringify(studentdata),teacher:JSON.stringify(teacherdata)})
												}
											}
										});							
								}
							});
						}
					});
				}
			});
}
});
app.get("/studentlist",function(req,res){
	MongoClient.connect(urlobj,{ useUnifiedTopology: true },function(err,db){
		if(err) throw err;
		else
		{
			let dataobj = db.db("portiontracker");
			dataobj.collection("students").find({}).toArray(function(err,data){
				if (err) throw err;
				else
					{
						if(data.length!=0)
						{
							res.render("studentlist",{studentlist:JSON.stringify(data)});
						}
						else
						{
							res.render("studentlist",{studentlist:"Error"});
						}
					}
				});
			}
		});
});
app.get("/teacherlist",function(req,res){
	MongoClient.connect(urlobj,{ useUnifiedTopology: true },function(err,db){
		if(err) throw err;
		else
		{
			let dataobj = db.db("portiontracker");
			dataobj.collection("teacher").find({}).toArray(function(err,data){
				if (err) throw err;
				else
					{
						if(data.length!=0)
						{
							res.render("teacherlist",{teacherlist:JSON.stringify(data)});
						}
						else
						{
							res.render("teacherlist",{teacherlist:"Error"});
						}
					}
				});
			}
		});
});
app.get("/classmanagerlist",function(req,res){
	MongoClient.connect(urlobj,{ useUnifiedTopology: true },function(err,db){
		if(err) throw err;
		else
		{
			let dataobj = db.db("portiontracker");
			dataobj.collection("users").find({cookieid:"0"}).toArray(function(err,data){
				if (err) throw err;
				else
					{
						if(data.length!=0)
						{
							res.render("classmanagerlist",{cmlist:JSON.stringify(data)});
						}
						else
						{
							res.render("classmanagerlist",{cmlist:"Error"});
						}
					}
				});
			}
		});
});
app.get("/faculty",function(req,res){
	MongoClient.connect(urlobj,{ useUnifiedTopology: true },function(err,db){
		if(err) throw err;
		else
		{
			let dataobj = db.db("portiontracker");
			dataobj.collection("teacher").find({}).toArray(function(err,data){
				if (err) throw err;
				else
					{
						if(data.length!=0)
						{
							res.render("faculty",{faculty:JSON.stringify(data)});
						}
						else
						{
							res.render("faculty",{faculty:"Error"});
						}
					}
				});
			}
		});
});
app.get("/public/images/:image", function(req, res){
	res.sendFile(__dirname+"/public/images/"+req.params.image);
});
app.get("/contactus",function(req,res){
res.render("contactus",{});
});
server.listen(3000);
