# Nitrogen

## Release

```shell
# Build
gulp build

# Copy to nitrogen-dist folder
cp -R build/ ../nitrogen-dist/

# Move to nitrogen-dist folder
cd ../nitrogen-dist

# Commit changes
git add .
git commit -m "updated to <LATEST COMMIT SHA>"

# Release plugin
apm release patch # it can be `major` or `minor` depends on release size
```

- - -
Copyright (c) 2015-Present Nitrous, Inc. All Rights Reserved
