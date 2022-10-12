const express = require('express');
const app = express();

//validatorjs
const Validator = require('validatorjs');

//knex
const knex = require('knex')({
    client: 'sqlite3',
    connection : {filename:process.cwd() + '/data' + '/db.sq3'},
    useNullAsDefault: true
});

async function InitDatabaseMigration(){

    console.log('Migration start');
    await knex.schema.createTableIfNotExists('tweets',(table)=>{
        table.increments('id').primary();
        table.string('tweet');
        table.string('username');
        //Tweetin atılma tarihi
        table.timestamp('created_at').defaultTo(knex.fn.now());
    })

    console.log('Migration end');
}
InitDatabaseMigration()

//JSON
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.get('/',function(req,res){
    res.send('Hello world');
})

// GET/tweets tüm tweetleri listele
app.get('/tweets',async(req,res)=>{
    try {
        var tweets = await knex('tweets').select();
    } catch (error) {   
        console.log(error);
        return res.status(500).send(error);
    }

    return res.json({
        tweets: tweets
    });

});

// GET/tweets/:id istenilen tweeti getir
app.get('/tweets/:id',async(req,res)=>{
    
    const id = req.params.id;
    try {
        var tweet = await knex('tweets').where('id',id).first();
    } catch (error) {   
        console.log(error);
        return res.status(500).send(error);
    }

    return res.json({
        tweet: tweet
    });

});
// POST/tweets yeni tweet ekleme
app.post('/tweets', async (req, res) => {
    const createDto = new Validator(req.body, {
        tweet: 'required|string|min:1|max:255',
        username: 'required|string|min:1|max:20'
    });

    if (createDto.fails()) {
        return res.status(400).json({
            message: createDto.errors.all()
        });
    }

    // save to db
    try {
        var tweet = await knex('tweets').insert({
            tweet: req.body.tweet, 
            username: req.body.username
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send(error);
    }

    return res.json({
        message: 'Tweet created',
        tweet : tweet
    });
});


// PUT/tweets/:id tweet güncelleme
app.put('/tweets/:id',async(req,res)=>{
    const id = req.params.id;
    const updateDto = new Validator(req.body,{
        tweet:'required|string|min:1|max:255',
        username:'required|string|min:1|max:20'
    });
    if(updateDto.fails()){
        return res.status(400).json({
            message:createDto.errors.all()
        })
    }

    //güncelleme işlemi
    try {
        //var tweet = await knex('tweets').update({
            var tweet = await knex('tweets').where('id', id).update({
            tweet: req.body.tweet,
            username: req.body.username
        })
    } catch (error) {
        console.log(error);
        return res.status(500).send(error);
    }

   return res.json({
    message: 'Tweet updated',
    updated_tweet: tweet
   });
   
});

// DELETE/tweets/:id tweet silme
app.delete('/tweets/:id',async(req,res)=>{
    
    const id = req.params.id;
    //Silme işlemi
    try {
        var tweet = await knex('tweets').where('id',id).del();
    } catch (error) {
        console.log(error);
        return res.status(500).send(error);
    }

    return res.json({
        message: 'Tweet deleted',
        deleted_tweet: tweet
       });
})

const port = process.env.port || 3000;
app.listen(port,()=>{
    console.log(`Server runing at http://localhost:${port}`);
});