import React, { Component, Fragment } from 'react';

import Product from '../../components/Feed/Product/Product';
import Button from '../../components/Button/Button';
import FeedEdit from '../../components/Feed/FeedEdit/FeedEdit';
import Input from '../../components/Form/Input/Input';
import Paginator from '../../components/Paginator/Paginator';
import Loader from '../../components/Loader/Loader';
import ErrorHandler from '../../components/ErrorHandler/ErrorHandler';
import './Feed.css';

class Feed extends Component {
  state = {
    isEditing: false,
    products: [],
    totalProducts: 0,
    editProduct: null,
    status: '',
    productPage: 1,
    productsLoading: true,
    editLoading: false
  };

  componentDidMount() {
    const graphqlQuery = {
      query: `
        {
          user {
            status
          }
        }
      `
    };
    fetch('https://mern-demo-vicky.herokuapp.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + this.props.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphqlQuery)
    })
      .then(res => {
        return res.json();
      })
      .then(resData => {
        if (resData.errors) {
          throw new Error('Fetching status failed!');
        }
        this.setState({ status: resData.data.user.status });
      })
      .catch(this.catchError);

    this.loadProducts();
  }

  loadProducts = direction => {
    if (direction) {
      this.setState({ productsLoading: true, products: [] });
    }
    let page = this.state.productPage;
    if (direction === 'next') {
      page++;
      this.setState({ productPage: page });
    }
    if (direction === 'previous') {
      page--;
      this.setState({ productPage: page });
    }
    const graphqlQuery = {
      query: `
        query FetchProducts($page: Int) {
          products(page: $page) {
            products {
              _id
              title
              price
              description
              creator {
                name
              }
              createdAt
            }
            totalProducts
          }
        }
      `,
      variables: {
        page: page
      }
    };
    fetch('https://mern-demo-vicky.herokuapp.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + this.props.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphqlQuery)
    })
      .then(res => {
        return res.json();
      })
      .then(resData => {
        if (resData.errors) {
          throw new Error('Fetching products failed!');
        }
        this.setState({
          products: resData.data.products.products.map(product => {
            return {
              ...product
            };
          }),
          totalProducts: resData.data.products.totalProducts,
          productsLoading: false
        });
      })
      .catch(this.catchError);
  };

  statusUpdateHandler = event => {
    event.preventDefault();
    const graphqlQuery = {
      query: `
        mutation UpdateUserStatus($userStatus: String!) {
          updateStatus(status: $userStatus) {
            status
          }
        }
      `,
      variables: {
        userStatus: this.state.status
      }
    };
    fetch('https://mern-demo-vicky.herokuapp.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + this.props.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphqlQuery)
    })
      .then(res => {
        return res.json();
      })
      .then(resData => {
        if (resData.errors) {
          throw new Error('Fetching products failed!');
        }
        console.log(resData);
      })
      .catch(this.catchError);
  };

  newProductHandler = () => {
    this.setState({ isEditing: true });
  };

  startEditProductHandler = productId => {
    this.setState(prevState => {
      const loadedProduct = { ...prevState.products.find(p => p._id === productId) };

      return {
        isEditing: true,
        editProduct: loadedProduct
      };
    });
  };

  cancelEditHandler = () => {
    this.setState({ isEditing: false, editProduct: null });
  };

  finishEditHandler = productData => {
    this.setState({
      editLoading: true
    });
    let graphqlQuery;
    graphqlQuery = {
      query: `
      mutation CreateNewProduct($title: String!, $price: String!, $description: String!) {
        createProduct(productInput: {title: $title, price: $price, description: $description}) {
          _id
          title
          price
          description
          creator {
            name
          }
          createdAt
        }
      }
    `,
      variables: {
        title: productData.title,
        price: productData.price,
        description: productData.description
      }
    };
    
      if (this.state.editProduct) {
        graphqlQuery = {
          query: `
            mutation UpdateExistingProduct($productId: ID!, $title: String!, $price: String!, $description: String!) {
              updateProduct(id: $productId, productInput: {title: $title, price: $price, description: $description}) {
                _id
                title
                price
                description
                creator {
                  name
                }
                createdAt
              }
            }
          `,
          variables: {
            productId: this.state.editProduct._id,
            title: productData.title,
            price: productData.price,
            description: productData.description
          }
        };
      }

      fetch('https://mern-demo-vicky.herokuapp.com/graphql', {
          method: 'POST',
          body: JSON.stringify(graphqlQuery),
          headers: {
            Authorization: 'Bearer ' + this.props.token,
            'Content-Type': 'application/json'
          }
      })
      .then(res => {
        return res.json();
      })
      .then(resData => {
        if (resData.errors && resData.errors[0].status === 422) {
          throw new Error(
            "Validation failed. Make sure the email address isn't used yet!"
          );
        }
        if (resData.errors) {
          throw new Error('User login failed!');
        }
        let resDataField = 'createProduct';
        if (this.state.editProduct) {
          resDataField = 'updateProduct';
        }
        const product = {
          _id: resData.data[resDataField]._id,
          title: resData.data[resDataField].title,
          price: resData.data[resDataField].price,
          description: resData.data[resDataField].description,
          creator: resData.data[resDataField].creator,
          createdAt: resData.data[resDataField].createdAt
        };
        this.setState(prevState => {
          let updatedProducts = [...prevState.products];
          let updatedTotalProducts = prevState.totalProducts;
          if (prevState.editProduct) {
            const productIndex = prevState.products.findIndex(
              p => p._id === prevState.editProduct._id
            );
            updatedProducts[productIndex] = product;
          } else {
            updatedTotalProducts++;
            if (prevState.products.length >= 2) {
              updatedProducts.pop();
            }
            updatedProducts.unshift(product);
          }
          return {
            products: updatedProducts,
            isEditing: false,
            editProduct: null,
            editLoading: false,
            totalProducts: updatedTotalProducts
          };
        });
      })
      .catch(err => {
        console.log(err);
        this.setState({
          isEditing: false,
          editProduct: null,
          editLoading: false,
          error: err
        });
      });
  };

  statusInputChangeHandler = (input, value) => {
    this.setState({ status: value });
  };

  deleteProductHandler = productId => {
    this.setState({ productsLoading: true });
    const graphqlQuery = {
      query: `
        mutation {
          deleteProduct(id: "${productId}")
        }
      `
    };
    fetch('https://mern-demo-vicky.herokuapp.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + this.props.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphqlQuery)
    })
      .then(res => {
        return res.json();
      })
      .then(resData => {
        if (resData.errors) {
          throw new Error('Deleting the product failed!');
        }
        console.log(resData);
        this.loadProducts();
      })
      .catch(err => {
        console.log(err);
        this.setState({ productsLoading: false });
      });
  };

  errorHandler = () => {
    this.setState({ error: null });
  };

  catchError = error => {
    this.setState({ error: error });
  };

  render() {
    return (
      <Fragment>
        <ErrorHandler error={this.state.error} onHandle={this.errorHandler} />
        <FeedEdit
          editing={this.state.isEditing}
          selectedProduct={this.state.editProduct}
          loading={this.state.editLoading}
          onCancelEdit={this.cancelEditHandler}
          onFinishEdit={this.finishEditHandler}
        />
        <section className="feed__status">
          <form onSubmit={this.statusUpdateHandler}>
            <Input
              type="text"
              placeholder="Your status"
              control="input"
              onChange={this.statusInputChangeHandler}
              value={this.state.status}
            />
            <Button mode="flat" type="submit">
              Update
            </Button>
          </form>
        </section>
        <section className="feed__control">
          <Button mode="raised" design="accent" onClick={this.newProductHandler}>
            New Product
          </Button>
        </section>
        <section className="feed">
          {this.state.productsLoading && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Loader />
            </div>
          )}
          {this.state.products.length <= 0 && !this.state.productsLoading ? (
            <p style={{ textAlign: 'center' }}>No products found.</p>
          ) : null}
          {!this.state.productsLoading && (
            <Paginator
              onPrevious={this.loadProducts.bind(this, 'previous')}
              onNext={this.loadProducts.bind(this, 'next')}
              lastPage={Math.ceil(this.state.totalProducts / 2)}
              currentPage={this.state.productPage}
            >
              {this.state.products.map(product => (
                <Product
                  key={product._id}
                  id={product._id}
                  author={product.creator.name}
                  date={new Date(product.createdAt).toLocaleDateString('en-US')}
                  title={product.title}
                  price={product.price}
                  description={product.description}
                  onStartEdit={this.startEditProductHandler.bind(this, product._id)}
                  onDelete={this.deleteProductHandler.bind(this, product._id)}
                />
              ))}
            </Paginator>
          )}
        </section>
      </Fragment>
    );
  }
}

export default Feed;
