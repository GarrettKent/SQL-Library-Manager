const express = require("express");
const Book = require("./models").Book;
const {sequelize} = require("./models");

const app = express();

app.use("/static", express.static("public"));

app.set('view engine', 'pug');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Redirects to books route
app.get('/', (req, res) => {
  res.redirect("/books");
});

// Shows the full list of books from newest to oldest
app.get('/books', (req, res) => {
    Book.findAll({order: [["year", "DESC"]]})
    .then(function(books) {
      res.render("index", {books: books, title: "Book List" });
    })
    .catch(function(err) {
      res.render("error", { error: err });
      console.log(err);
    });
});

// Shows the create new book form
app.get('/books/new', (req, res) => {
    res.render("new-book", 
    {
     title: "New Book", 
     book: Book.build()
    })
});

// Posts a new book to the database
app.post('/books/new', (req, res) => {
    Book.create(req.body)
      .then(function(book) { 
        res.redirect("/books/" + book.id); 
  })
      .catch(function(err) {
        if(err.name === "SequelizeValidationError") { 
          res.render("new-book", {
            book: Book.build(req.body),
            title: "New Book",
            errors: err.errors 
          });
        } else { throw err }
  })
      .catch(function(err) {
        res.render("error", { error: err });
        console.log(err);
  })
});

//Shows a specific book that is clicked on, allowing it to be updated or deleted. If not, an error appears.
app.get('/books/:id', (req, res) => {
    Book.findByPk(req.params.id)
    .then(function(book) { 
      if(book) { 
      res.render("update-book", {book: book, title: "Edit Book"});
    } else {
      const err = "We can't seem to find this book";
      res.render("page-not-found", { error: err });
    }
  }).catch(function(err) {
    res.render("error", { error: err });
    console.log(err);
  });   
});

// Updates book info in the database. If not, server error occurs
app.post('/books/:id', (req, res) => {
	Book.findByPk(req.params.id).then(function(book) { 
    if(book) {
      return book.update(req.body);
      } else { res.send(404) }
  })
    .then(function(book) {
      res.redirect("/books/" + book.id);
  })
    .catch(function(err) {
      if(err.name === "SequelizeValidationError") {
        const book = Book.build(req.body);
        book.id = req.params.id;
        res.render("update-book", 
        { book: book,
          title: "Edit Book",
          errors: err.errors
        });
      } else { throw err }
  })
    .catch(function(err) {
    res.render("error", { error: err });
    console.log(err);
  });  
});

// Deletes a book
app.post('/books/:id/delete', (req, res) => { 
  Book.findByPk(req.params.id)
  .then(function(book) {
    if(book) {
      return book.destroy();
    } else {
      res.send(404);
    }
  }).then(function() {
    res.redirect("/books");
  }).catch(function(err) {
    res.render("error", { error: err });
    console.log(err);
  }); 
});

app.use((req, res, next) => {
  const err = new Error("Sorry it appears we can't find this page");
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  res.status(err.status);
  res.render("page-not-found", { error: err });
  console.log(err);
  next(err);
});

sequelize.sync().then(function () {
  app.listen(3000, () => {
    console.log('The application is listening on localhost:3000!');
});
})