# Copyright (c) 2011, salesforce.com, inc.
# All rights reserved.
#
# Redistribution and use in source and binary forms, with or without modification, are permitted provided
# that the following conditions are met:
#
#    Redistributions of source code must retain the above copyright notice, this list of conditions and the
#    following disclaimer.
#
#    Redistributions in binary form must reproduce the above copyright notice, this list of conditions and
#    the following disclaimer in the documentation and/or other materials provided with the distribution.
#
#    Neither the name of salesforce.com, inc. nor the names of its contributors may be used to endorse or
#    promote products derived from this software without specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED
# WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
# PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
# ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
# TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
# HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
# NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
# POSSIBILITY OF SUCH DAMAGE.
require "openssl"
require "base64"

class SignedRequest

  # Construct a SignedRequest based on the stringified version of it.
  def initialize(consumerSecret, signedRequest)
    @consumerSecret = consumerSecret
    @signedRequest = signedRequest
  end

  # Validates the signed request by verifying the key, then returns
  # the json string.
  def verifyAndDecode()

    # Validate secret and signed request string.
    raise "Consumer secret not set." if @consumerSecret.blank?()
    raise "Signed request not set." if @signedRequest.blank?()

    # 1) Split the signed request into signature and payload.
    array = @signedRequest.split('.')
    raise "Incorrectly formatted signed request." if array.length != 2
    signature = array[0]
    payload = array[1]

    # 2) Verify the contents of the payload by first validating the authenticity
    #    of the signature.
    decodedSignature = Base64.decode64(signature)
    digest = OpenSSL::Digest::Digest.new("sha256")
    hmac = OpenSSL::HMAC.digest(digest, @consumerSecret, payload)
    raise "Signed request has been tampered with." if decodedSignature != hmac

    # 3) Decode the base64 encoded payload of the canvas request.
    jsonString = Base64.decode64(payload).gsub("'","\\\\'")
    return jsonString
  end
end