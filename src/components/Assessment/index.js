import {Component} from 'react'
import Loader from 'react-loader-spinner'
import Header from '../Header'
import './index.css'

const apiStatusConstants = {
  initial: 'INITIAL',
  success: 'SUCCESS',
  failure: 'FAILURE',
  inProgress: 'IN_PROGRESS',
}

class Assessment extends Component {
  state = {
    assessmentQuestion: [],
    selectedNumberedQuestionIndex: 0,
    currentQuestionIndex: 0,
    answeredQuestionsCount: 0,
    unansweredQuestionsCount: 0, // Added to track unanswered questions
    isClickedQuestionNumber: false,
    isCorrectOptionClicked: false,
    isAnyOptionClicked: false,
    selectedOption: '', // Added to track selected option
    score: 0,
    timer: 600, // 10 minutes in seconds
    apiStatus: apiStatusConstants.initial,
    timeUp: false, // Changed initial value to false
    total: 0,
  }

  componentDidMount() {
    this.getData()
    this.startTimer()
  }

  getData = async () => {
    this.setState({apiStatus: apiStatusConstants.inProgress})
    try {
      const response = await fetch('https://apis.ccbp.in/assess/questions')
      const data = await response.json()
      console.log(data)
      this.setState({total: data?.questions?.length})
      if (response.ok === true) {
        const updatedData = data.questions.map(eachQuestion => ({
          id: eachQuestion.id,
          optionsType: eachQuestion.options_type,
          questionText: eachQuestion.question_text,
          options: eachQuestion.options.map(eachOption => ({
            optionId: eachOption.id,
            text: eachOption.text,
            isCorrect: eachOption.is_correct,
            imageUrl: eachOption.image_url,
          })),
        }))
        this.setState({
          assessmentQuestion: updatedData,
          apiStatus: apiStatusConstants.success,
          total: data?.questions?.length || 0,
          unansweredQuestionsCount: data?.questions?.length || 0, // Initialize with total questions
        })
      } else {
        this.setState({apiStatus: apiStatusConstants.failure})
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      this.setState({apiStatus: apiStatusConstants.failure})
    }
  }

  startTimer = () => {
    this.timerFunction = setInterval(() => {
      const {timer} = this.state
      if (timer > 0) {
        this.setState(prevState => ({timer: prevState.timer - 1}))
      } else {
        clearInterval(this.timerFunction)
        this.endAssessment()
        this.setState({timeUp: true}) // Set timeUp to true when timer ends
      }
    }, 1000)
  }

  onClickRetryButton = () => {
    this.getData()
  }

  endAssessment = () => {
    const {history} = this.props
    const {timeUp} = this.state

    if (!timeUp) {
      // If time is not up, navigate to results with timeUp as true
      history.replace('/results', {timeUp: true})
    }

    clearInterval(this.timerFunction)
  }

  onSubmit = () => {
    const {history} = this.props
    const {score, timer} = this.state

    // Convert timer to formatted time string
    const formattedTimer = this.formatTime(timer)

    history.replace('/results', {score, formattedTimer})
    clearInterval(this.timerFunction)
  }

  formatTime = timeInSeconds => {
    const hours = Math.floor(timeInSeconds / 3600)
    const minutes = Math.floor((timeInSeconds % 3600) / 60)
    const seconds = timeInSeconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  renderAssessmentFailure = () => (
    <div className="failure-container">
      <div className="failure-content-card">
        <img
          src="https://res.cloudinary.com/dzaz9bsnw/image/upload/v1704822095/Group_7519_ed27tg.jpg"
          alt="failure view"
          className="failure-image"
        />
        <h1 className="something-went-wrong">Oops! Something went wrong</h1>
        <p className="some-trouble">We are having some trouble</p>
        <button
          onClick={this.onClickRetryButton}
          className="retry-btn"
          type="button"
        >
          Retry
        </button>
      </div>
    </div>
  )

  renderLoader = () => (
    <div className="loader-container" data-testid="loader">
      <Loader type="ThreeDots" color="#263868" height={50} width={50} />
    </div>
  )

  renderAssessmentSuccess = () => {
    const {timer, total} = this.state
    const formattedTimer = this.formatTime(timer)

    return (
      <div className="assessment-main-container">
        <div className="assessment-questions-container">
          <h1 className="main-heading">Questions ({total})</h1>
          {this.renderQuestion()}
        </div>
        <div className="summary-timer-container">
          <div className="timer-container">
            <p className="time-heading">Time Left</p>
            <p className="timer">{formattedTimer}</p>
          </div>
          <div className="assessment-summary-container">
            {this.renderAssessmentSummary()}
          </div>
        </div>
      </div>
    )
  }

  renderAssessmentDetails = () => {
    const {apiStatus} = this.state

    switch (apiStatus) {
      case apiStatusConstants.success:
        return this.renderAssessmentSuccess()
      case apiStatusConstants.failure:
        return this.renderAssessmentFailure()
      case apiStatusConstants.inProgress:
        return this.renderLoader()
      default:
        return null
    }
  }

  onClickSummaryButton = id => {
    const {assessmentQuestion} = this.state
    const selectedQuestionData = assessmentQuestion.findIndex(
      item => item.id === id,
    )
    console.log(selectedQuestionData)
    this.setState({
      selectedNumberedQuestionIndex: selectedQuestionData,
      currentQuestionIndex: selectedQuestionData,
      isClickedQuestionNumber: true,
    })
  }

  onClickAnswer = id => {
    const {
      assessmentQuestion,
      currentQuestionIndex,
      isCorrectOptionClicked,
      isAnyOptionClicked,
      unansweredQuestionsCount,
    } = this.state

    const currentQuestion = assessmentQuestion[currentQuestionIndex]
    const selectedOptionData = currentQuestion.options.find(
      item => item.optionId === id,
    )

    if (!isCorrectOptionClicked && selectedOptionData.isCorrect === 'true') {
      this.setState(prevState => ({
        score: prevState.score + 1,
        isCorrectOptionClicked: true,
      }))
    }

    if (!isAnyOptionClicked) {
      this.setState({
        isAnyOptionClicked: true,
        unansweredQuestionsCount: unansweredQuestionsCount - 1, // Decrement unanswered count
      })
    }

    this.setState({selectedOption: id})
  }

  handleOnClickNextBtn = () => {
    const {
      currentQuestionIndex,
      assessmentQuestion,
      isCorrectOptionClicked,
      isAnyOptionClicked,
      unansweredQuestionsCount,
    } = this.state

    if (currentQuestionIndex < assessmentQuestion.length - 1) {
      this.setState(prevState => ({
        currentQuestionIndex: prevState.currentQuestionIndex + 1,
        isClickedQuestionNumber: false,
      }))
    }

    if (isCorrectOptionClicked || isAnyOptionClicked) {
      this.setState(prevState => ({
        answeredQuestionsCount: prevState.answeredQuestionsCount + 1,
        isCorrectOptionClicked: false,
        isAnyOptionClicked: false,
      }))
    }

    if (!isAnyOptionClicked) {
      this.setState({
        unansweredQuestionsCount: unansweredQuestionsCount - 1, // Decrement unanswered count
      })
    }
  }

  renderAssessmentSummary = () => {
    const {total, answeredQuestionsCount, unansweredQuestionsCount} = this.state

    return (
      <div className="assessment-summary">
        <div className="answered-unanswered-card">
          <div className="answered">
            <p className="answered-span">{answeredQuestionsCount}</p>
            <p>Answered Questions</p>
          </div>
          <p className="unanswered">
            <p className="unanswered-span">{unansweredQuestionsCount}</p>{' '}
            Unanswered Questions
          </p>
        </div>
        <hr className="summary-horizontal-line" />
        <div className="question-submit-btn-card">
          <div>
            <p className="question-number-heading">Questions ({total})</p>
            <ul className="question-number-card">
              {this.renderQuestionNumbers()}
            </ul>
          </div>
          <button onClick={this.onSubmit} type="button" className="submit-btn">
            Submit Assessment
          </button>
        </div>
      </div>
    )
  }

  renderQuestionNumbers = () => {
    const {assessmentQuestion} = this.state

    return assessmentQuestion.map((item, index) => (
      <button
        type="button"
        className="question-number"
        onClick={() => this.onClickSummaryButton(item.id)}
        key={item.id}
      >
        {index + 1}
      </button>
    ))
  }

  renderQuestion = () => {
    const {
      assessmentQuestion,
      currentQuestionIndex,
      selectedNumberedQuestionIndex,
      isClickedQuestionNumber,
      selectedOption,
    } = this.state

    const currentQuestion =
      assessmentQuestion[
        isClickedQuestionNumber
          ? selectedNumberedQuestionIndex
          : currentQuestionIndex
      ]

    const {questionText, options, optionsType} = currentQuestion
    const isLastQuestion =
      currentQuestionIndex === assessmentQuestion.length - 1

    return (
      <div className="question-main-container">
        <p className="question-text">
          {currentQuestionIndex + 1}. {questionText}
        </p>
        <hr className="horizontal-line" />
        {optionsType === 'DEFAULT' && (
          <div className="option-container">
            <ul>{this.renderOptions(options)}</ul>
          </div>
        )}
        {optionsType === 'IMAGE' && (
          <ul className="option-container">
            {this.renderImageOptions(options)}
          </ul>
        )}
        {optionsType === 'SINGLE_SELECT' && (
          <>
            <div className="mini-card">
              <select
                className="select-card"
                onChange={e => this.onClickAnswer(e.target.value)}
                value={selectedOption}
              >
                {this.renderSelectOptions(options)}
              </select>
            </div>
            <p className="selected-by-default">
              First option is selected by default
            </p>
          </>
        )}
        <div className="btn-card">
          {isLastQuestion ? null : (
            <button
              type="button"
              className="nxt-button"
              onClick={this.handleOnClickNextBtn}
            >
              Next Question
            </button>
          )}
        </div>
      </div>
    )
  }

  renderOptions = options => {
    const {selectedOption} = this.state

    return options.map(option => (
      <li key={option.optionId}>
        <button
          type="button"
          className={selectedOption === option.optionId ? 'selected' : 'normal'}
          onClick={() => this.onClickAnswer(option.optionId)}
        >
          {option.text}
        </button>
      </li>
    ))
  }

  renderImageOptions = options => {
    const {selectedOption} = this.state

    return options.map(option => (
      <li key={option.optionId}>
        <img
          className={
            selectedOption === option.optionId ? 'selectedImg' : 'normalImg'
          }
          onClick={() => this.onClickAnswer(option.optionId)}
          src={option.imageUrl}
          alt={option.text}
        />
      </li>
    ))
  }

  renderSelectOptions = options =>
    options.map(option => (
      <option
        className="normalOption"
        value={option.optionId}
        key={option.optionId}
      >
        {option.text}
      </option>
    ))

  render() {
    return (
      <>
        <Header />
        {this.renderAssessmentDetails()}
      </>
    )
  }
}

export default Assessment
