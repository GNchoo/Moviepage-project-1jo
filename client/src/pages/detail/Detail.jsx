import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";

import tmdbApi from "../../api/tmdbApi";
import apiConfig from "../../api/apiConfig";

import "./detail.scss";
import CastList from "./CastList";
import VideoList from "./VideoList";

import MovieList from "../../components/movie-list/MovieList";

import { ImStarFull, ImStarEmpty } from "react-icons/im";

import styled from "styled-components";

import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

import axios from "axios";
import { ServerApi } from "../../api/ServerApi";

const RatingBox = styled.div`
  & svg {
    color: #c4c4c4;
    cursor: pointer;
  }

  .yellow {
    color: yellow;
  }
  .rating {
    :hover svg {
      color: yellow;
    }
    & svg:hover ~ svg {
      color: #c4c4c4;
    }
  }
`;

function sumArray(arr) {
  return arr.reduce((acc, curr) => acc + curr, 0);
}

const Detail = () => {
  const { category, id } = useParams();
  const [item, setItem] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [list, setList] = useState([]);
  const PER_PAGE = 3;
  const totalItems = list.length;
  const totalPages = Math.ceil(totalItems / PER_PAGE);

  const start = (currentPage - 1) * PER_PAGE;
  const end = start + PER_PAGE;
  const [searchResults, setSearchResults] = useState([]);
  const currentList =
    searchResults.length > 0 ? searchResults : list.slice(start, end);

  const array = [0, 1, 2, 3, 4]; // 별점 5개
  const [clicked, setClicked] = useState([true, false, false, false, false]); // 1 true 0 false

  const _id = localStorage.getItem("id"); // 로컬스토리지의 아이디 담기
  const [userId, setUserId] = useState(_id); // 작성자 state
  const name = localStorage.getItem("name"); // 로컬스토리지의 이름 담기
  const [writer, setWriter] = useState(name); // 작성자 state
  const [text, setText] = useState([]); // 새로운 게시글을 담는 state
  const sex = localStorage.getItem("sex"); // 로컬스토리지의 성별 담기
  const [writerSex, setWriterSex] = useState(sex);
  const currentYear = new Date().getFullYear();
  const birth = localStorage.getItem("birth");
  const [writerBirth, setWriterBirth] = useState(birth);

  const navigate = useNavigate();

  useEffect(() => {
    const getDetail = async () => {
      const response = await tmdbApi.detail(category, id, { params: {} });
      setItem(response);
      window.scrollTo(0, 0);
    };
    getDetail();
  }, [category, id]);

  const handleStarClick = (index) => {
    let clickStates = [...clicked];
    for (let i = 0; i < 5; i++) {
      clickStates[i] = i <= index ? true : false;
    }
    setClicked(clickStates);
  };

  const handlePostChange = (event, editor) => {
    const data = editor.getData();
    const strippedData = data.replace(/(<([^>]+)>)/gi, "");
    if (strippedData.length <= 50) {
      setText(strippedData);
    }
  };

  const editorConfig = {
    toolbar: [],
    styles: {
      color: "black",
    },
    maxLength: 50,
  };

  useEffect(() => {
    axios
      .get(`${ServerApi}/movie/${id}`)
      .then((response) => {
        setList(response.data);
      })
      .catch((error) => console.log(error));
  }, [id]);

  const handlePrevPage = () => {
    if (currentPage === 1) {
      return;
    }
    setCurrentPage((prevPage) => prevPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage === Math.ceil(list.length / PER_PAGE)) {
      return;
    }
    setCurrentPage((prevPage) => prevPage + 1);
  };

  const CommentWrite = (event) => {
    event.preventDefault();
    setUserId(userId);
    setWriter(writer); // 작성자 값 실어서 보냄
    setWriterSex(writerSex); // 작성자 값 실어서 보냄
    setWriterBirth(writerBirth.substring(0, 4)); // 작성자 값 실어서 보냄
    setClicked(clicked);

    axios
      .post(`${ServerApi}/movie/${id}/add`, {
        username: userId,
        text: text,
        writer: writer,
        star: sumArray(clicked),
        sex: writerSex,
        age: currentYear - writerBirth.substring(0, 4) + 1,
      })
      .then((response) => {
        // API 호출을 통해 한줄평 목록 다시 불러오기
        axios.get(`${ServerApi}/movie/${id}`).then((response) => {
          setText(response.data);
          navigate(`/movie`); // 글쓰기가 완료되면 영화 페이지로 재 리다이렉트
        });
      })
      .catch((error) => console.log(error));

    setText(""); // 글쓰기 완료 후 새로운 텍스트 내용 초기화
  };

  const commentDelete = (event, commentId) => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      event.preventDefault();
      axios
        .delete(`${ServerApi}/movie/${id}`, { data: { _id: commentId } })
        .then((response) => {
          navigate("/movie");
        })
        .catch((error) => console.log(error));
    } else {
      navigate(`/movie/${id}`);
    }
  };

  let totalStar = 0;
  let averageStar = 0;
  let score = 0;

  list.forEach((list) => {
    if (!isNaN(list.star)) {
      totalStar += list.star;
    }
  });

  if (list.length > 0) {
    averageStar = totalStar / list.length;
    score = averageStar;
    averageStar = Math.round(averageStar); // 반올림 처리
    score = score.toFixed(1); //소숫점 1자리까지만
  }

  const [ageRatings, setAgeRatings] = useState({});

  function getAgeGroup(age) {
    if (age > 0 && age < 20) {
      return "10대";
    } else if (age >= 20 && age < 30) {
      return "20대";
    } else if (age >= 30 && age < 40) {
      return "30대";
    } else if (age >= 40 && age < 50) {
      return "40대";
    } else if (age >= 50 && age < 60) {
      return "50대";
    } else {
      return "알수 없음";
    }
  }

  useEffect(() => {
    // 평균 평점 계산 로직
    const calculateAverageRatings = () => {
      const ageRatings = {
        "10대": 0,
        "20대": 0,
        "30대": 0,
        "40대": 0,
        "50대": 0,
        // 추가적인 연령대는 이곳에 추가할 수 있습니다.
      };

      const countRatings = {
        "10대": 0,
        "20대": 0,
        "30대": 0,
        "40대": 0,
        "50대": 0,
        // 추가적인 연령대는 이곳에 추가할 수 있습니다.
      };

      list.forEach((item) => {
        if (!isNaN(item.star) && item.age) {
          const ageGroup = getAgeGroup(item.age);
          if (ageRatings.hasOwnProperty(ageGroup)) {
            ageRatings[ageGroup] += item.star;
            countRatings[ageGroup]++;
          }
        }
      });

      for (const ageGroup in ageRatings) {
        if (countRatings[ageGroup] > 0) {
          ageRatings[ageGroup] = (
            ageRatings[ageGroup] / countRatings[ageGroup]
          ).toFixed(1);
        }
      }

      setAgeRatings(ageRatings);
    };

    calculateAverageRatings(); // 컴포넌트가 마운트될 때 평균 평점 계산

    // 만약 `list` 배열이 변경될 때마다 평균 평점을 다시 계산하려면 `list`를 의존성 배열로 추가하고, 이벤트 핸들러를 구현해야 합니다.
    // 예: list 배열이 변경될 때마다 calculateAverageRatings() 호출
  }, [list]); // 의존성 배열로 list를 추가하여 useEffect()의 호출 조건 설정

  const [sexRatings, setSexRatings] = useState({});

  function getSexGroup(sex) {
    if (sex === "male") {
      return "남성";
    } else if (sex === "female") {
      return "여성";
    }
  }

  useEffect(() => {
    // 평균 평점 계산 로직
    const calculateSexAverageRatings = () => {
      const sexRatings = {
        남성: 0,
        여성: 0,
      };

      const countRatings = {
        남성: 0,
        여성: 0,
      };

      list.forEach((item) => {
        if (!isNaN(item.star) && item.sex) {
          const sexGroup = getSexGroup(item.sex);
          if (sexRatings.hasOwnProperty(sexGroup)) {
            sexRatings[sexGroup] += item.star;
            countRatings[sexGroup]++;
          }
        }
      });

      for (const sexGroup in sexRatings) {
        if (countRatings[sexGroup] > 0) {
          sexRatings[sexGroup] = (
            sexRatings[sexGroup] / countRatings[sexGroup]
          ).toFixed(1);
        }
      }

      setSexRatings(sexRatings);
    };

    calculateSexAverageRatings(); // 컴포넌트가 마운트될 때 평균 평점 계산

    // 만약 `list` 배열이 변경될 때마다 평균 평점을 다시 계산하려면 `list`를 의존성 배열로 추가하고, 이벤트 핸들러를 구현해야 합니다.
    // 예: list 배열이 변경될 때마다 calculateAverageRatings() 호출
  }, [list]); // 의존성 배열로 list를 추가하여 useEffect()의 호출 조건 설정

  const [isLiked, setIsLiked] = useState(false);
  const isMovie = window.location.pathname.includes("/movie");

  const clickLike = (event) => {
    event.preventDefault();
    const updatedLiked = !isLiked;

    let url;
    let requestBody;
    let type;
    if (isMovie) {
      url = `${ServerApi}/movie/${id}/like`;
      requestBody = {
        username: userId,
        movieLikes: updatedLiked,
      };
      type = "movie";
    } else {
      url = `${ServerApi}/tv/${id}/like`;
      requestBody = {
        username: userId,
        tvLikes: updatedLiked,
      };
      type = "tv";
    }

    axios
      .post(url, requestBody)
      .then((response) => {
        const isLiked = response.data.isLiked;
        setIsLiked(isLiked);
        navigate(`/${type}`);
      })
      .catch((error) => console.log(error));
  };

  useEffect(() => {
    let url;

    if (isMovie) {
      url = `${ServerApi}/movie/${id}/like`;
    } else {
      url = `${ServerApi}/tv/${id}/like`;
    }

    axios
      .get(url, {
        params: {
          username: userId,
        },
      })
      .then((response) => {
        const user = response.data.isLiked;
        setIsLiked(user);
      })
      .catch((error) => console.log(error));
  }, [id, userId, isLiked, isMovie]);

  const buttonStyle = {
    marginLeft: "10px",
    borderRadius: "20px",
    backgroundColor: isLiked ? "#333" : "#0AB9A2",
    fontWeight: "bold",
  };

  return (
    <>
      {item && (
        <>
          <div
            className="banner"
            style={{
              backgroundImage: `url(${apiConfig.originalImage(
                item.backdrop_path || item.poster_path
              )})`,
            }}
          ></div>
          <div className="mb-3 movie-content container">
            <div className="movie-content__poster">
              <div
                className="movie-content__poster__img"
                style={{
                  backgroundImage: `url(${apiConfig.originalImage(
                    item.poster_path || item.backdrop_path
                  )})`,
                }}
              ></div>
            </div>
            <div className="movie-content__info">
              <h1 className="title">{item.title || item.name}</h1>
              <RatingBox style={{ marginBottom: "20px" }}>
                {array.map((index) => (
                  <ImStarFull
                    key={index}
                    className={index < averageStar ? "yellow" : ""}
                    size="40"
                  />
                ))}
                <span style={{ fontSize: "25px", marginLeft: "10px" }}>
                  {score} / 5.0
                </span>
                <button style={buttonStyle} onClick={clickLike}>
                  {isLiked ? "싫어요" : "좋아요"}
                </button>
              </RatingBox>
              <div className="genres">
                {item.genres &&
                  item.genres.slice(0, 5).map((genre, i) => (
                    <span key={i} className="genres__item">
                      {genre.name}
                    </span>
                  ))}
              </div>
              <p className="overview">{item.overview}</p>
              <div className="cast">
                <div className="section__header">
                  <h2>출연진</h2>
                </div>
                <CastList id={item.id} />
              </div>
            </div>
          </div>
          <div className="container">
            <div className="section mb-3">
              <h2>유튜브 트레일러 보기</h2>
              <VideoList id={item.id} />
            </div>
            <table className="starscore">
              <thead>
                <tr>
                  <th>연령별 평점</th>
                  <th>성별별 평점</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    {Object.entries(ageRatings).map(
                      ([ageGroup, averageRating]) => (
                        <div
                          key={ageGroup}
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            textAlign: "center",
                          }}
                        >
                          <RatingBox style={{ marginBottom: "20px" }}>
                            {ageGroup} :
                            {array.map((index) => (
                              <ImStarFull
                                key={index}
                                className={
                                  index < averageRating ? "yellow" : ""
                                }
                                size="20"
                              />
                            ))}
                          </RatingBox>
                        </div>
                      )
                    )}
                  </td>
                  <td>
                    {Object.entries(sexRatings).map(
                      ([sexGroup, aversexRating]) => (
                        <div
                          key={sexGroup}
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            textAlign: "center",
                          }}
                        >
                          <RatingBox style={{ marginBottom: "20px" }}>
                            {sexGroup} :
                            {array.map((index) => (
                              <ImStarFull
                                key={index}
                                className={
                                  index < aversexRating ? "yellow" : ""
                                }
                                size="20"
                              />
                            ))}
                          </RatingBox>
                        </div>
                      )
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
            <br />
            <div>
              <div>
                <h2
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  한줄평
                </h2>
                <table className="comment">
                  {currentList.map((list) => (
                    <tr key={list.id}>
                      {/* <td>{list._id}</td> */}
                      <td>{list.text}</td>
                      <td>{list.writer}</td>
                      <td>
                        <RatingBox>
                          {array.map((index) => (
                            <ImStarFull
                              key={index}
                              className={index < list.star ? "yellow" : ""}
                              size="18"
                            />
                          ))}
                        </RatingBox>
                      </td>
                      <td>{list.date}</td>
                      {userId === list.username && ( //!조건 작성자일치시(나중에 아이디값으로 교체 예정) //아이디로 변경완료
                        <td>
                          <span
                            class="material-icons"
                            onClick={(event) => commentDelete(event, list._id)}
                          >
                            delete_forever
                          </span>
                        </td>
                      )}
                    </tr>
                  ))}
                </table>
                <div className="board-pagination">
                  <span className="material-icons" onClick={handlePrevPage}>
                    arrow_back_ios
                  </span>
                  <span onClick={handlePrevPage}>Prev</span>
                  <span>
                    {currentPage} / {totalPages}
                  </span>
                  <span onClick={handleNextPage}>Next</span>
                  <span className="material-icons" onClick={handleNextPage}>
                    arrow_forward_ios
                  </span>
                </div>
                <div className="input-comment">
                  <div className="rate-user">
                    <RatingBox className="rating">
                      {array.map((el) => (
                        <ImStarFull
                          key={el}
                          onClick={() => handleStarClick(el)}
                          className={clicked[el] && "yellow"}
                          size="18"
                        />
                      ))}
                    </RatingBox>
                    <input
                      type="text"
                      name="user"
                      value={writer}
                      disabled={true}
                      onChange={(e) => setWriter(e.target.value)}
                    />
                  </div>
                  <div className="inputbox">
                    <CKEditor
                      editor={ClassicEditor}
                      config={editorConfig}
                      onChange={handlePostChange}
                      value={text}
                    />
                  </div>
                  <span
                    onClick={CommentWrite}
                    style={{ marginTop: "22px", fontSize: "20px" }}
                  >
                    작성
                  </span>
                  <span onClick={CommentWrite} class="material-icons">
                    create
                  </span>
                </div>
              </div>
            </div>
            <div className="section mb-3">
              <div className="section__header mb-2">
                <h2>비슷한 영화 추천</h2>
              </div>
              <MovieList category={category} type="similar" id={item.id} />
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Detail;
