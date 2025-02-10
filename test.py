import numpy as np

def test(m):
    unique = np.unique(m)

    occurance_number = {'max_number':None, 'occurance':0}
    for i in range(0, len(unique)):
        my_number = m[i]
        occurance = 0
        for j in range(0, len(m)):
            if my_number == m[j]:
                occurance += 1
        if occurance > occurance_number.occurance:
            occurance_number.max_number = my_number
            occurance_number.occurance = occurance


    return occurance_number

if __name__ == '__main__':
    result = test([1,2,3,4,40,3,2, 3])
    print('result: ', result.max_number, result.occurance)