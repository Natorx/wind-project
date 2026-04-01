use axum::{
    routing::get,
    Router,
};

#[tokio::main]
async fn main() {
    let app = Router::new().route("/",get(hello_handler));
    let listener = tokio::net::TcpListener::bind("127.0.0.1:3001").await.unwrap();
    println!("Server already running on http://127.0.0.1:3001");
    axum::serve(listener,app).await.unwrap();
}

async fn hello_handler() -> &'static str {
    "Hello,Axum!"
}