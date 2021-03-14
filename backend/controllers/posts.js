const execSync = require('child_process').execSync;
const fs = require('fs');
const path = require("path");

const Post = require("../models/post");

var isWin = process.platform === "win32";

exports.createPost = (req, res, next) => {
  imagePath = generateMandelbrot(req);

  const post = new Post({
    title: req.body.title,
    xMin: req.body.xMin,
    xMax: req.body.xMax,
    yMin: req.body.yMin,
    yMax: req.body.yMax,
    contours: req.body.contours,
    theme: req.body.theme,
    iterations: req.body.iterations,
    size: req.body.size,
    imagePath: imagePath,
    creator: req.userData.userId
  });
  post
    .save()
    .then(createdPost => {
      res.status(201).json({
        message: "Post added successfully",
        post: {
          ...createdPost,
          id: createdPost._id
        }
      });
    })
    .catch(error => {
      res.status(500).json({
        message: "Creating a post failed!"
      });
    });
};

exports.updatePost = (req, res, next) => {
  imagePath = generateMandelbrot(req);
  deleteImage(req);

  const post = new Post({
    _id: req.body.id,
    title: req.body.title,
    xMin: req.body.xMin,
    xMax: req.body.xMax,
    yMin: req.body.yMin,
    yMax: req.body.yMax,
    contours: req.body.contours,
    theme: req.body.theme,
    iterations: req.body.iterations,
    size: req.body.size,
    imagePath: imagePath,
    creator: req.userData.userId
  });
  Post.updateOne({ _id: req.params.id, creator: req.userData.userId }, post)
    .then(result => {
      if (result.n > 0) {
        res.status(200).json({ message: "Update successful!" });
      } else {
        res.status(401).json({ message: "Not authorized!" });
      }
    })
    .catch(error => {
      res.status(500).json({
        message: "Couldn't udpate post!"
      });
    });
};

exports.getPosts = (req, res, next) => {
  const pageSize = +req.query.pagesize;
  const currentPage = +req.query.page;
  const postQuery = req.userData != null && req.userData.userId != null ? Post.find({ creator: req.userData.userId }) : Post.find();
  let fetchedPosts;
  if (pageSize && currentPage) {
    postQuery.skip(pageSize * (currentPage - 1)).limit(pageSize);
  }
  postQuery
    .then(documents => {
      fetchedPosts = documents;
      return Post.count();
    })
    .then(count => {
      res.status(200).json({
        message: "Posts fetched successfully!",
        posts: fetchedPosts,
        maxPosts: count
      });
    })
    .catch(error => {
      res.status(500).json({
        message: "Fetching posts failed!"
      });
    });
};

exports.getPost = (req, res, next) => {
  Post.findById(req.params.id)
    .then(post => {
      if (post) {
        res.status(200).json(post);
      } else {
        res.status(404).json({ message: "Post not found!" });
      }
    })
    .catch(error => {
      res.status(500).json({
        message: "Fetching post failed!"
      });
    });
};

exports.deletePost = (req, res, next) => {
  deleteImage(req);

  Post.deleteOne({ _id: req.params.id, creator: req.userData.userId })
    .then(result => {
      console.log(result);
      if (result.n > 0) {
        res.status(200).json({ message: "Deletion successful!" });
      } else {
        res.status(401).json({ message: "Not authorized!" });
      }
    })
    .catch(error => {
      res.status(500).json({
        message: "Deleting posts failed!"
      });
    });
};


function deleteImage(req) {
  Post.findById(req.params.id)
    .then(post => {
      if (post) {
        const url = req.protocol + "://" + req.get("host");
        const imageUrl = post.imagePath;
        imagePath = imageUrl.replace(url + "/","");
        imagePath = path.join(__dirname, "../") + imagePath;
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } else {
        console.log("Post not found during image deletion!");
      }
    })
    .catch(error => {
      console.log("Fetching post failed during image deletion!");
    });
}

function generateMandelbrot(req) {
  const mandelbrot_exe = isWin ? "mandelbrot.exe" : "./mandelbrot";

  tempDir = getTempDir();
  const cmd = "cd " + tempDir + " && " +
        path.join(__dirname, "../mandelbrot/") + mandelbrot_exe +
        " -c " + req.body.contours +
        " -i " + req.body.iterations +
        " -s " + req.body.size +
        " -t " + req.body.theme +
        " " + req.body.xMin + " " +  req.body.xMax + " " +  req.body.yMin + " " +  req.body.yMax;
  console.log("RUNNING: " + cmd)
  result = execSync(cmd);

  const imageFilename = Date.now() + ".png";

  fs.renameSync(tempDir + "/contours.png", path.join(__dirname, "../images/") + imageFilename);
  //fs.rmdirSync(tempDir, { recursive: true });  // requires Node.js >= 12.0
  deleteFolderRecursive(tempDir);

  const url = req.protocol + "://" + req.get("host");
  imagePath = url + "/images/" + imageFilename;

  return imagePath;
}

function getTempDir() {
  return fs.mkdtempSync("temp-"); 
}

// https://stackoverflow.com/questions/18052762/remove-directory-which-is-not-empty
const deleteFolderRecursive = function (directoryPath) {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file, index) => {
      const curPath = path.join(directoryPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // recurse
        deleteFolderRecursive(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(directoryPath);
  }
};
