import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useProfileMutation } from "../slices/usersApiSlice";
import { Row, Col, Form, Button, Table } from "react-bootstrap";
import {LinkContainer} from "react-router-bootstrap"
import Loader from "../components/Loader";
import Message from "../components/Message";
import { toast } from "react-toastify";
import { setCredentials } from "../slices/authSlice";
import { useGetMyOrdersQuery } from "../slices/ordersApiSlice";
import { FaTimes } from "react-icons/fa";

const ProfileScreen = () => {
  const dispatch = useDispatch();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { userInfo } = useSelector((state) => state.auth);

  const [updateProfile, { isLoading: loadingUpdateProfile }] =
    useProfileMutation();

  const { data: orders, isLoading, error } = useGetMyOrdersQuery();

  useEffect(() => {
    if (userInfo) {
      setName(userInfo.name);
      setEmail(userInfo.email);
    }
  }, [userInfo.name, userInfo.email, userInfo]);

  const submitHandler = async (evt) => {
    evt.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
    } else {
      try {
        const res = await updateProfile({
          _id: userInfo._id,
          name,
          email,
          password,
        }).unwrap();
        dispatch(setCredentials(res));
        toast.success("Profile updated successfully!");
      } catch (err) {
        console.log(err);
        toast.error(err?.data?.message || err?.error);
      }
    }
  };

  return (
    <Row>
      {/* COL 1 - USER_DETAILS*/}
      <Col md={3}>
        <h2>User Profile</h2>
        <Form onSubmit={submitHandler}>
          <Form.Group controlId="name" className="my-2">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="name"
              placeholder="Enter name"
              value={name}
              onChange={(evt) => setName(evt.target.value)}
            />
          </Form.Group>
          <Form.Group controlId="email" className="my-2">
            <Form.Label>Email Address</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(evt) => setEmail(evt.target.value)}
            />
          </Form.Group>
          <Form.Group controlId="password" className="my-2">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(evt) => setPassword(evt.target.value)}
            />
          </Form.Group>
          <Form.Group controlId="confirmPassword" className="my-2">
            <Form.Label>Confirm Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter password again"
              value={confirmPassword}
              onChange={(evt) => setConfirmPassword(evt.target.value)}
            />
          </Form.Group>
          <Button type="submit" variant="primary">
            Update
          </Button>
          {loadingUpdateProfile && <Loader />}
        </Form>
      </Col>

      {/* COL 2 - USER_ORDERS*/}
      <Col md={9}>
        <h2>My Orders</h2>
        {isLoading ? (
          <Loader />
        ) : error ? (
          <Message variant="danger">
            {error?.data?.message || error.error}
          </Message>
        ) : (
          <>
            <Table striped hover responsive className="table-sm">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>DATE</th>
                  <th>TOTAL</th>
                  <th>PAID</th>
                  <th>DELIEVERED</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>{order._id}</td>
                    <td>{order.createdAt.substring(0, 10)}</td>
                    <td>${order.totalPrice}</td>
                    <td>
                      {order.isPaid ? (
                        order.paidAt.substring(0, 10)
                      ) : (
                        <FaTimes style={{ color: "red" }} />
                      )}
                    </td>
                    <td>
                      {order.isDeliveted ? (
                        order.delieverdAt.substring(0, 10)
                      ) : (
                        <FaTimes style={{ color: "red" }} />
                      )}
                    </td>
                    <LinkContainer to={`/orders/${order._id}`}>
                      <Button className="btn-sm" variant="light">
                        Details
                      </Button>
                    </LinkContainer>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}
      </Col>
    </Row>
  );
};

export default ProfileScreen;
