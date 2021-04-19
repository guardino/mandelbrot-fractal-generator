const execSync = require('child_process').execSync;
const fs = require('fs');
const path = require("path");

const Post = require("../models/post");

const use_80bit_precision  = 1.0e-11;  // 1.0e-13 is the limit
const use_128bit_precision = 1.0e-15;  // 1.0e-16 is the limit

var isWin = process.platform === "win32";

exports.createPost = (req, res, next) => {
  imagePath = generateMandelbrot(req);

  const post = new Post({
    parentId: req.body.parentId,
    title: req.body.title,
    xMin: req.body.xMin,
    xMax: req.body.xMax,
    yMin: req.body.yMin,
    yMax: req.body.yMax,
    xC: req.body.xC,
    yC: req.body.yC,
    contours: req.body.contours,
    theme: req.body.theme,
    iterations: req.body.iterations,
    size: req.body.size,
    fractal: req.body.fractal,
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
    parentId: req.body.parentId,
    title: req.body.title,
    xMin: req.body.xMin,
    xMax: req.body.xMax,
    yMin: req.body.yMin,
    yMax: req.body.yMax,
    xC: req.body.xC,
    yC: req.body.yC,
    contours: req.body.contours,
    theme: req.body.theme,
    iterations: req.body.iterations,
    size: req.body.size,
    fractal: req.body.fractal,
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
  const fractal = +req.query.fractal;

  //TODO: Simplify the construction of queryFilter
  let queryFilter;
  if (req.userData != null && req.userData.userId != null)
  {
    if (fractal && fractal == 2)
    {
      queryFilter = { creator: req.userData.userId, fractal: fractal };
    }
    else if (fractal && fractal == 1)  // Required for backward compatibility with posts without fractal field
    {
      queryFilter = { creator: req.userData.userId, $or: [{fractal: fractal}, {fractal: null}] };
    }
    else
    {
      queryFilter = { creator: req.userData.userId };
    }
  }
  else if (fractal && fractal == 2)
  {
    queryFilter = { fractal: fractal };
  }
  else if (fractal && fractal == 1)  // Required for backward compatibility with posts without fractal field
  {
    queryFilter = { $or: [{fractal: fractal}, {fractal: null}] };
  }

  const postQuery = Post.find(queryFilter).sort( { '_id': -1 } );
  let fetchedPosts;
  if (pageSize && currentPage) {
    postQuery.skip(pageSize * (currentPage - 1)).limit(pageSize);
  }
  postQuery
    .then(documents => {
      fetchedPosts = documents;
      return Post.count(queryFilter);
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
  var bit_accuracy = "64";
  if (Math.abs(req.body.xMax - req.body.xMin) < use_128bit_precision || Math.abs(req.body.yMax - req.body.yMin) < use_128bit_precision) {
    bit_accuracy = "128";
  }
  else if (Math.abs(req.body.xMax - req.body.xMin) < use_80bit_precision || Math.abs(req.body.yMax - req.body.yMin) < use_80bit_precision) {
    bit_accuracy = "80";
  }

  var mandelbrot_exe = "mandelbrot-" + bit_accuracy;
  if (isWin) {
    mandelbrot_exe += ".exe";
  }

  tempDir = getTempDir();
  cmd = "cd " + tempDir + " && " +
        path.join(__dirname, "../mandelbrot/") + mandelbrot_exe +
        " -c " + req.body.contours +
        " -f " + req.body.fractal +
        " -i " + req.body.iterations +
        " -s " + req.body.size +
        " -t " + req.body.theme +
        " " + req.body.xMin + " " +  req.body.xMax + " " +  req.body.yMin + " " +  req.body.yMax;

  if (req.body.fractal == "2") {
    cmd += " " + req.body.xC + " " +  req.body.yC;
  }
  else {
    cmd += " 0.0 0.0";
  }

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
