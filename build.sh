# get version from package.json
version=$(cat package.json | grep -o '"version": "[^"]*' | grep -o '[^"]*$')
echo "Building version '$version'"

tag_latest="jasperhaward/chatters-server:latest"
tag_versioned="jasperhaward/chatters-server:$version"

echo "Building docker image with tags: '$tag_latest', '$tag_versioned'"
docker build . -t "$tag_latest" -t "$tag_versioned"

echo "Pushing docker image '$tag_latest'"
docker push "$tag_latest"

echo "Pushing docker image '$tag_versioned'"
docker push "$tag_versioned"