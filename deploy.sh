source .env

min_aws_version="2"
build_version=$( [ "${BUILD_VERSION:${#BUILD_VERSION}-1:1}" == "/" ] && printf "${BUILD_VERSION:0:${#BUILD_VERSION}-1}" || printf "$BUILD_VERSION" )

# General Functions
err() { # Display an error message
  printf "$0: $1\n" >&2
}

validate_version() {
  local PROGRAM_NAME="$1"
  local EXIT_BOOL="$2"
  local ERROR_STRING="$3"
  local MIN_VERSION="$4"
  local CURRENT_VERSION="$5"
  if [ ! "$(printf '%s\n' "$MIN_VERSION" "$CURRENT_VERSION" | sort -V | head -n1)" = "$MIN_VERSION" ]; then
    err "Your current $PROGRAM_NAME version ($CURRENT_VERSION) is too old. ${ERROR_STRING}"
    if [ "${EXIT_BOOL}" = "1" ]; then
      exit 1
    fi
  fi
}

get_aws_version() {
  if [[ -n $(which aws) ]]; then
    printf "$(aws --version | sed 's/ .*//' | sed 's/[^0-9+.]*//g')"
  else
    err "\nYou need to install AWS version ${min_aws_ver} or greater."
    exit 1
  fi
}

get_buckets() {
  aws s3api list-buckets --query "Buckets[?Name=='$S3_BUCKET'].Name"
}

get_distributions() {
  aws cloudfront list-distributions --query "DistributionList.Items[].{source:(Origins.Items[?DomainName=='$distribution_domain'].DomainName | [0] )}"
}

get_deployed_distributions() {
  aws cloudfront list-distributions --query "DistributionList.Items[?Status=='Deployed'].{distribution:DomainName, source:(Origins.Items[?DomainName=='$distribution_domain'].DomainName | [0])}"
}

get_deployed_distribution_domain() {
  aws cloudfront list-distributions --query "DistributionList.Items[?Status=='Deployed'].{distribution:DomainName, source:(Origins.Items[?DomainName=='$distribution_domain'].DomainName | [0])} | [?source=='$distribution_domain'].distribution | [0]" | sed 's/"//g'
}

get_deployed_distribution_id() {
  aws cloudfront list-distributions --query "DistributionList.Items[?Status=='Deployed'].{distribution:Id, source:(Origins.Items[?DomainName=='$distribution_domain'].DomainName | [0])} | [?source=='$distribution_domain'].distribution | [0]" | sed 's/"//g'
}

get_optimized_distribution_cache_policy_id() {
  aws cloudfront list-cache-policies --query "CachePolicyList.Items[?CachePolicy.CachePolicyConfig.Name=='Managed-CachingOptimized'].CachePolicy.Id | [0]"
}

get_s3_build() {
  aws s3api list-objects --bucket $S3_BUCKET --prefix $BUILD_VERSION --query "Contents[].Key | [0]"
}

# Check for AWS CLI Version
current_aws_version=$(get_aws_version)
install_aws="\nPlease install version ${min_aws_version} or greater."
validate_version "aws" "1" "${install_aws}" "${min_aws_version}" "${current_aws_version}"

# Check if bucket exists
all_buckets=$(get_buckets)
if ! $(grep -q "$S3_BUCKET" <<< "$all_buckets"); then
  # Create bucket if not exists
  printf "\nBucket '${S3_BUCKET}' not found. Attempting to create it..."
  aws s3api create-bucket --bucket $S3_BUCKET

  # Validate Bucket was Created
  all_buckets=$(get_buckets)
  if ! $(grep -q "$S3_BUCKET" <<< "$all_buckets"); then
    err "\nUnable to create bucket (${S3_BUCKET})."
    exit 1
  else
    printf "\nCreated new bucket (${S3_BUCKET})."
  fi
fi

# Check if distribution exists
distribution_domain="$S3_BUCKET.s3.amazonaws.com"
if ! $(grep -q "$distribution_domain" <<< "$(get_distributions)"); then
  # Create distribution if not exists
  printf "\nDistribution CDN not found. Attempting to create it..."
  aws cloudfront create-distribution --origin-domain-name $distribution_domain --output text > /dev/null

  # Validate Distribution was Created
  if ! $(grep -q "$distribution_domain" <<< "$(get_distributions)"); then
    err "\nUnable to create distribution."
    exit 1
  else
    printf "\nCreated new distribution."
  fi
fi

# Check to make sure distribution is deployed
while ! $(grep -q "$distribution_domain" <<< "$(get_deployed_distributions)"); do
  printf "\nWaiting for distribution to be deployed..."
  sleep 30
done

# Check if desired S3 Bucket Path exists
requires_invalidation="0"
if $(grep -q "$BUILD_VERSION" <<< "$(get_s3_build)"); then
  read -r -p "BUILD_VERSION ($BUILD_VERSION) already exists in the bucket $S3_BUCKET. Would you like to overwrite it? [y/N] " input
  case ${input} in
    [yY][eE][sS] | [yY])
      printf "Overwriting BUILD_VERSION ($BUILD_VERSION)..."
      requires_invalidation="1"
      ;;
    [nN][oO] | [nN] | "")
      err "Deployment canceled"
      exit 1
      ;;
    *)
      err "Invalid input: Deployment canceled."
      exit 1
      ;;
  esac
fi

# Deploy to desired S3 location
printf "Deploying ${BUILD_PATH} --> ${S3_BUCKET}/${BUILD_VERSION}\n\n"
aws s3 cp ${BUILD_PATH} s3://${S3_BUCKET}/${BUILD_VERSION} --recursive --acl public-read
printf "\n\n"
if [ $requires_invalidation == "1" ]; then
  printf "Invalidating cache for distribution to handle overwrite...\n"
  aws cloudfront create-invalidation --distribution-id $(get_deployed_distribution_id) --paths "/${build_version}*"
  printf "\n\n"
fi

printf "You can access your deployment assets via S3 at:\n https://${S3_BUCKET}.s3.amazonaws.com/${BUILD_VERSION}/index.html\n"

printf "\nYou can access your deployment assets via CDN at:\n $(get_deployed_distribution_domain)/${BUILD_VERSION}/index.html\n"
