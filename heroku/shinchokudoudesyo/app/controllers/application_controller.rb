class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  #protect_from_forgery with: :exception
  protect_from_forgery with: :null_session

  
private

  def require_sfdc_token
    token = request.headers['X-Sfdc-Token']
    session = request.headers['X-Sfdc-Session']

    puts '-------------- token:'
    puts token

    puts '-------------- session:'
    puts session

    # TODO: 認証...
    render :text => 'token or session is required... ' if token.blank? && session.blank?
  end

  def allow_iframe
    response.headers.except! 'X-Frame-Options'
  end
end
