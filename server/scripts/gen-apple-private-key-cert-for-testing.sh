#!/usr/bin/env sh

# Apple's secrets (as used in src/shared/lambda/oauth/apple.ts) use a cert downloaded from apple. This script generates a fake one for testing purposes

# first generate a private key:

##### openssl path
# MAC SPECIFIC :/
# NOTE: We need the non-mac bundled openssl for -addext (https://security.stackexchange.com/a/183973/40848)
#  We're using homebrew installed v1.1 here and I tested with OpenSSL 1.1.1g  21 Apr 2020
OPEN_SSL_BIN=/usr/local/opt/openssl\@1.1/bin/openssl
#####

ALGORITH=secp256r1
echo "key:"
openssl ecparam -out ec_key.pem -name $ALGORITH -genkey 

echo ""

echo "cert:"

$OPEN_SSL_BIN req\
  -new\
  -key ec_key.pem\
  -x509\
  -nodes
  -days 3650\
  -subj '/CN=test-apple-cert.com/O=No Company/C=US'
  -out cert.pem
