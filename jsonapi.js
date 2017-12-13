const express = require('express');
const bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/movies";
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const server = app.listen(process.env.PORT || 8080, () => {
  console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});
app.get('/jsonapi',(req, res) =>{
	//console.log('res',res.body)
	console.log('req',req.query)
	nodeDialogInt(req.query,res)
	
});

app.get('/suggestion',(req, res) =>{
	//console.log('res',res.body)
	var query = { language:  new RegExp('.*' + 'hindi' + '.*', 'i')}
MongoClient.connect(url, function(err, db) {
          	if (err) throw err;
          	db.collection("movie_list_test_year_removed").find(query).limit(5).toArray(function(err, result) {
            if (err) throw err;
            db.close();
             //console.log('Mongo_Result_len',result)
             if (result.length == 0) {
              var ermsg = 'Oops my database is currently very small buddy!! Let me send all my spiders to get the data!';
              sendTextMessage(req.body,ermsg);
            }
            else if  (result.length > 0){
              console.log('Mongo_Result',result)
              console.log('Database_result:',result)
      		gallery_template(res,result)
            }
            });
          	});
	
});



function nodeDialogInt(text_query,res){
	console.log('Query_nodedialog', text_query)
  let query = text_query.query
  
  var apiai = require('apiai');
  var app = apiai("b9a186dba6754188a5c8a486c0bd7bc9");  /////?????????? Nodejs to Dialog-flow Integration
  var request = app.textRequest(query, {
      sessionId: 'fc4621c6-ce6e-4f0b-929e-b9d76edaecf2'
  });
   
  request.on('response', function(response) {
      console.log('Nodedialog_response: ',response);

      switch_cases = response.result.action
      console.log('Switch case: ',switch_cases)

      switch(switch_cases){
      	case 'movie_query.namebase':
      		let mov_name_movquery = response.result.parameters['Name_list_movie'];
      		var query = { Movie_Name: mov_name_movquery };
      		console.log('Mov_name_movQuery , Query: ' ,mov_name_movquery,query)
      		break;
      	case 'genre_query':
      		let genre = response.result.parameters['Name_list_genre'];
      		var query = { mgenre:  new RegExp('.*' + genre + '.*', 'i')};
      		console.log('Query: ',query)
      		break;
      	case 'language_query':
      		let language = response.result.parameters['movie_lang'];
      		var query = { language:  new RegExp('.*' + language + '.*', 'i')};
      		console.log('Language , Query: ' ,language,query)
			break;
      	case 'video_result.trailer':
      		let mov_name_trail_query = response.result.parameters['Name_list_movie'];
      		var query = { Movie_Name:  new RegExp('.*' + mov_name_trail_query + '.*', 'i')};
      		console.log('Mov name , Query: ' ,mov_name_trail_query,query)
      		break;
      	case 'send_resume':
      		console.log('Specific file path')
      		break;
      	case 'cast_search.namebase':
      		console.log('Cast_search')
      		break;
      	default:
      		console.log('Default case')
      		var msg = 'Sorry my db is small rigth now! My spiders are getting ready to crawl data'
    		sendTextMessage(req.body,msg)
    		break;
      }

      // MongoDb Call .........
      MongoClient.connect(url, function(err, db) {
          	if (err) throw err;
          	db.collection("movie_list_test_year_removed").find(query).toArray(function(err, result) {
            if (err) throw err;
            db.close();
             //console.log('Mongo_Result_len',result)
             if (result.length == 0) {
              var ermsg = 'Oops my database is currently very small buddy!! Let me send all my spiders to get the data!';
              sendTextMessage(req.body,ermsg);
            }
            else if  (result.length > 0){
              console.log('Mongo_Result',result)
              console.log('Database_result:',result)
      		gallery_template(res,result)
            }
            });
          	});

  });
  request.on('error', function(error) {
      console.log(error);
  });
  request.end();
}


function gallery_template(res,result){

      var mov_name = result[0].Movie_Name

      var poster = result[0].imdb_movie_poster
      var ratings = result[0].rating_no
      var mov_link = result[0].imurl
      console.log(mov_name,poster,ratings,mov_link)

  var movie_list = [
        {
            "title": mov_name,
            "subtitle": "Imdb_rating " + ratings,
            "image_url": poster,
            "buttons": [
              {
                "title": "View_details",
                "type": "web_url",
                "url": mov_link
              },
              {
                "title": "Show similar",
                "type": "web_url",
                "url": "http://www.imdb.com/"}
            ]
          }
  ]
 for(var i = 1; i < result.length;i++){
  movie_list.push(
        {
            "title": result[i].Movie_Name,
            "subtitle": "Imdb_ratings " + result[i].rating_no,
            "image_url": result[i].poster,
            "buttons": [
              {
                "title": "View_details",
                "type": "web_url",
                "url": result[i].imurl
              },
              {
                "title": "Show similar",
                "type": "web_url",
                "url": "http://www.imdb.com/"}
            ]
          }
  )       
}
      res.send({
 "messages": [
    {
      "attachment":{
        "type":"template",
        "payload":{
          "template_type":"generic",
          "image_aspect_ratio": "square",
          "elements": movie_list
        }
      }
    }
  ]
})
}


